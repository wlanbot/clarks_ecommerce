const paymentService = require('../services/paymentService');
const paymentRepository = require('../repositories/PaymentRepository');
const { PaymentNotFoundError, InvalidPaymentStatusError } = require('../utils/paymentErrors');
const { PaymentProvider, PaymentStatus } = require('../models/enums');
const Money = require('../valueObjects/Money');
const Payment = require('../entities/Payment');

/**
 * @swagger
 * components:
 *   schemas:
 *     PaymentItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Identificador del ítem
 *         title:
 *           type: string
 *           description: Título del ítem
 *         description:
 *           type: string
 *           description: Descripción del ítem
 *         quantity:
 *           type: number
 *           description: Cantidad
 *         unitPrice:
 *           type: number
 *           description: Precio unitario
 *     CreatePaymentRequest:
 *       type: object
 *       required:
 *         - amount
 *         - currency
 *         - description
 *         - provider
 *       properties:
 *         amount:
 *           type: number
 *           description: Monto del pago
 *         currency:
 *           type: string
 *           description: Moneda (código de 3 letras)
 *         description:
 *           type: string
 *           description: Descripción del pago
 *         callbackUrl:
 *           type: string
 *           description: URL de retorno después del pago
 *         customerEmail:
 *           type: string
 *           description: Email del cliente
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/PaymentItem'
 *         metadata:
 *           type: object
 *           description: Metadatos adicionales
 *         provider:
 *           type: string
 *           enum: [MERCADO_PAGO, STRIPE, PAYPAL]
 *           description: Proveedor de pago
 *     PaymentStatusResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID del pago
 *         status:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED, REFUNDED, CANCELLED]
 *           description: Estado del pago
 *         orderId:
 *           type: string
 *           description: ID de la orden
 *         transactionId:
 *           type: string
 *           description: ID de la transacción del proveedor
 *         providerPaymentId:
 *           type: string
 *           description: ID del pago en el proveedor
 *         provider:
 *           type: string
 *           description: Proveedor del pago
 *         amount:
 *           type: number
 *           description: Monto del pago
 *         currency:
 *           type: string
 *           description: Moneda
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación
 *         processorResponse:
 *           type: object
 *           description: Respuesta del procesador de pago
 *     RefundRequest:
 *       type: object
 *       properties:
 *         amount:
 *           type: number
 *           description: Monto a reembolsar (opcional, por defecto el monto total)
 */

/**
 * @swagger
 * /api/payments:
 *   post:
 *     summary: Crear un nuevo pago
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePaymentRequest'
 *     responses:
 *       200:
 *         description: Pago creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 paymentId:
 *                   type: string
 *                 status:
 *                   type: string
 *                 redirectUrl:
 *                   type: string
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error del servidor
 */
exports.createPayment = async (req, res, next) => {
  try {
    const dto = req.body;
    
    // Verificar si ya existe un pago con este orderId
    const existingPayment = await paymentRepository.findByOrderId(dto.metadata?.orderId);
    if (existingPayment) {
      return res.status(400).json({
        success: false,
        error: `Ya existe un pago con ese orderId: ${dto.metadata.orderId}`
      });
    }
    
    // Crear pago con servicio externo
    const paymentResult = await paymentService.createPayment({
      amount: dto.amount,
      currency: dto.currency,
      description: dto.description,
      callbackUrl: dto.callbackUrl,
      metadata: dto.metadata,
      customerEmail: dto.customerEmail,
      items: dto.items,
      provider: dto.provider
    });
    
    // Guardar la información de pago en nuestra base de datos
    const payment = new Payment({
      amount: new Money(dto.amount, dto.currency),
      status: paymentResult.status,
      provider: dto.provider,
      providerPaymentId: paymentResult.providerPaymentId,
      orderId: dto.metadata?.orderId,
      metadata: {
        ...dto.metadata,
        processorResponse: paymentResult.processorResponse
      }
    });
    
    const savedPayment = await paymentRepository.create(payment);
    
    return res.status(201).json({
      success: true,
      id: savedPayment.id,
      paymentId: savedPayment.providerPaymentId,
      status: savedPayment.status,
      redirectUrl: paymentResult.redirectUrl
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/payments/{id}:
 *   get:
 *     summary: Obtener estado de un pago
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la orden de pago
 *     responses:
 *       200:
 *         description: Estado del pago recuperado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentStatusResponse'
 *       404:
 *         description: Pago no encontrado
 */
exports.getPaymentStatus = async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const payment = await paymentRepository.findByOrderId(orderId);
    
    if (!payment) {
      throw new PaymentNotFoundError();
    }
    
    // Si el pago tiene un reembolso registrado, devolver el registro de nuestra db
    if (payment.metadata.refundDetails && payment.provider === PaymentProvider.STRIPE) {
      return res.json({
        success: true,
        id: payment.id,
        status: payment.status,
        orderId: payment.orderId,
        transactionId: payment.transactionId,
        providerPaymentId: payment.providerPaymentId,
        provider: payment.provider,
        amount: payment.amount.amount,
        currency: payment.amount.currency,
        createdAt: payment.createdAt,
        processorResponse: payment.metadata.processorResponse
      });
    }
    
    try {
      // Determinar qué ID usar para consultar el estado
      const idsFromPayment = {
        transactionId: payment.transactionId,
        providerPaymentId: payment.providerPaymentId,
        orderId: payment.orderId
      };
      
      // Obtener el estado más reciente del proveedor de pago
      const status = await paymentService.getPaymentDetails(
        idsFromPayment,
        payment.provider
      );
      
      // Actualizar nuestro registro local si el estado ha cambiado
      if (payment.status !== status) {
        payment.status = status;
        payment.updatedAt = new Date();
        await paymentRepository.update(payment.id, {
          status,
          updatedAt: payment.updatedAt,
          transactionId: payment.transactionId
        });
      }
      
      // Si tenemos metadata, extraemos la respuesta del procesador
      const processorResponse = payment.metadata?.processorResponse;
      
      return res.json({
        success: true,
        id: payment.id,
        status: payment.status,
        orderId: payment.orderId,
        transactionId: payment.transactionId,
        providerPaymentId: payment.providerPaymentId,
        provider: payment.provider,
        amount: payment.amount.amount,
        currency: payment.amount.currency,
        createdAt: payment.createdAt,
        processorResponse
      });
    } catch (error) {
      throw new PaymentProviderError(payment.provider, error);
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/payments/{id}/refund:
 *   post:
 *     summary: Reembolsar un pago
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la orden de pago
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefundRequest'
 *     responses:
 *       200:
 *         description: Pago reembolsado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 status:
 *                   type: string
 *                 refundId:
 *                   type: string
 *                 refundAmount:
 *                   type: object
 *                   properties:
 *                     amount:
 *                       type: number
 *                     currency:
 *                       type: string
 *                 refundStatus:
 *                   type: string
 *       404:
 *         description: Pago no encontrado
 *       400:
 *         description: Estado de pago inválido para reembolso
 */
exports.refundPayment = async (req, res, next) => {
  try {
    const paymentId = req.params.id;
    const { amount } = req.body;
    
    const payment = await paymentRepository.findByOrderId(paymentId);
    if (!payment) {
      throw new PaymentNotFoundError();
    }
    
    if (!payment.canBeRefunded()) {
      throw new InvalidPaymentStatusError(
        payment.status,
        PaymentStatus.APPROVED
      );
    }
    
    // Si se proporciona un monto, crea una instancia de Money con ese monto
    // Si no, usa el monto completo del pago
    const refundAmount = amount
      ? new Money(amount, payment.amount.currency)
      : payment.amount;
    
    // Actualizamos el pago con el monto a reembolsar
    payment.amount = refundAmount;
    
    const refundResult = await paymentService.refundPayment(payment);
    
    // Verificamos que el reembolso esté en un estado válido
    if (!['APPROVED', 'PENDING', 'REFUNDED'].includes(refundResult.status)) {
      throw new Error(`Refund status is ${refundResult.status}`);
    }
    
    // Marcamos el pago como reembolsado
    payment.markAsRefunded(
      refundResult.refundId,
      refundResult.processorResponse
    );
    
    // Actualizamos el pago en la base de datos
    await paymentRepository.update(payment.id, {
      status: payment.status,
      updatedAt: payment.updatedAt,
      metadata: {
        ...payment.metadata,
        refundDetails: {
          id: refundResult.refundId,
          amount: refundAmount.amount,
          currency: refundAmount.currency,
          date: new Date().toISOString(),
          status: refundResult.status
        }
      }
    });
    
    return res.json({
      success: true,
      id: payment.id,
      status: payment.status,
      refundId: refundResult.refundId,
      refundAmount: {
        amount: refundAmount.amount,
        currency: refundAmount.currency
      },
      refundStatus: refundResult.status
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/payments/{id}/refunds:
 *   get:
 *     summary: Obtener lista de reembolsos de un pago
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la orden de pago
 *     responses:
 *       200:
 *         description: Lista de reembolsos obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 paymentId:
 *                   type: string
 *                 refunds:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       amount:
 *                         type: number
 *                       status:
 *                         type: string
 *                       dateCreated:
 *                         type: string
 *                         format: date-time
 *       404:
 *         description: Pago no encontrado
 */
exports.getRefunds = async (req, res, next) => {
  try {
    const paymentId = req.params.id;
    
    const payment = await paymentRepository.findByOrderId(paymentId);
    if (!payment) {
      throw new PaymentNotFoundError();
    }
    
    const paymentIds = {
      transactionId: payment.transactionId,
      providerPaymentId: payment.providerPaymentId,
      orderId: payment.orderId,
      payment_intent: payment.metadata?.webhookData?.payment_intent
    };
    
    const refundsResult = await paymentService.getRefunds(
      paymentIds,
      payment.provider
    );
    
    // Si encuentra el reembolso y no está registrado, actualiza el pago en la base de datos
    if (refundsResult && refundsResult.refunds.length > 0 && !payment.metadata.refundDetails) {
      const [latestRefund] = refundsResult.refunds; // Tomar el primer reembolso
      
      // Actualizar el estado del pago a "Refunded"
      payment.markAsRefunded(latestRefund.id, refundsResult);
      
      // Actualizar el pago en la base de datos con los detalles del reembolso
      await paymentRepository.update(payment.id, {
        status: payment.status,
        updatedAt: payment.updatedAt,
        metadata: {
          ...payment.metadata,
          refundDetails: {
            id: latestRefund.id,
            amount: latestRefund.amount,
            date: latestRefund.dateCreated.toISOString(),
            status: latestRefund.status,
            metadata: latestRefund.metadata
          }
        }
      });
    }
    
    return res.json({
      success: true,
      paymentId: payment.id,
      refunds: refundsResult.refunds.map(refund => ({
        ...refund,
        paymentId: payment.id
      }))
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/payments/refunds/{id}:
 *   get:
 *     summary: Obtener detalles de un reembolso específico
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del pago
 *     responses:
 *       200:
 *         description: Detalles del reembolso obtenidos exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 paymentId:
 *                   type: string
 *                 amount:
 *                   type: number
 *                 status:
 *                   type: string
 *                 dateCreated:
 *                   type: string
 *                   format: date-time
 *                 metadata:
 *                   type: object
 *       404:
 *         description: Pago o reembolso no encontrado
 */
exports.getRefund = async (req, res, next) => {
  try {
    const paymentId = req.params.id;
    
    const payment = await paymentRepository.findByOrderId(paymentId);
    if (!payment) {
      throw new PaymentNotFoundError();
    }
    
    // Verificamos que el pago tenga un reembolso registrado
    if (!payment.metadata.refundDetails) {
      return res.status(404).json({
        success: false,
        error: `No refund has been recorded for payment ${paymentId}`
      });
    }
    
    try {
      const paymentIds = {
        transactionId: payment.transactionId,
        providerPaymentId: payment.providerPaymentId,
        orderId: payment.orderId,
        payment_intent: payment.metadata?.webhookData?.payment_intent,
        refundId: payment.metadata.refundDetails.id
      };
      
      const refundResult = await paymentService.getRefund(
        paymentIds,
        payment.provider
      );
      
      return res.json({
        success: true,
        id: refundResult.id,
        paymentId: payment.id,
        amount: refundResult.amount,
        status: refundResult.status,
        dateCreated: refundResult.dateCreated,
        metadata: refundResult.metadata
      });
    } catch (error) {
      console.error(
        `Error getting refund for payment ${payment.id}`,
        error
      );
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/payments/webhook/mercadopago:
 *   post:
 *     summary: Procesar webhook de Mercado Pago
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook procesado exitosamente
 */
exports.handleMercadoPagoWebhook = async (req, res, next) => {
  try {
    await paymentService.processWebhook({
      payload: req.body,
      provider: 'MERCADO_PAGO'
    });
    
    return res.json({ success: true });
  } catch (error) {
    // No propagar el error al cliente para evitar que MercadoPago reintente
    console.error('Error processing MercadoPago webhook:', error);
    return res.status(200).json({ success: true });
  }
};

/**
 * @swagger
 * /api/payments/webhook/stripe:
 *   post:
 *     summary: Procesar webhook de Stripe
 *     tags: [Payments]
 *     parameters:
 *       - in: header
 *         name: stripe-signature
 *         required: true
 *         schema:
 *           type: string
 *         description: Firma del webhook de Stripe
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook procesado exitosamente
 */
exports.handleStripeWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['stripe-signature'];
    
    const result = await paymentService.processWebhook({
      payload: req.body,
      signature,
      provider: 'STRIPE'
    });
    
    return res.json({
      success: true,
      ...result
    });
  } catch (error) {
    // No propagar el error al cliente para evitar que Stripe reintente
    console.error('Error processing Stripe webhook:', error);
    return res.status(200).json({ success: true });
  }
};