const Payment = require('../models/Payment');
const User = require('../models/User');
const paymentService = require('../services/PaymentService');
const { PaymentStatus, PaymentProvider } = require('../utils/constants');
const { PaymentNotFoundError, InvalidPaymentStatusError, PaymentProviderError } = require('../utils/paymentErrors');
const logger = require('../utils/logger');

exports.create = async (req, res) => {
  try {
    const { body, headers } = req;
    // Extraer datos desde el body o headers
    const customerId = body.metadata?.customerId || headers["x-customer-id"];
    const customerEmail = body.customerEmail || headers["x-customer-email"];

    const createPaymentDto = body;

    // Buscar el usuario por documentId para la relación
    let cliente = null;
    if (customerId) {
      const usuario = await User.findOne({ _id: customerId });
      if (usuario) {
        cliente = usuario._id.toString();
      }
    }

    // Crear el pago con el servicio externo
    const paymentResult = await paymentService.createPayment({
      currency: createPaymentDto.currency,
      description: createPaymentDto.description,
      callbackUrl: createPaymentDto.callbackUrl,
      metadata: createPaymentDto.metadata,
      customerEmail,
      items: createPaymentDto.items,
      provider: createPaymentDto.provider,
    });

    // Guardar la información del pago en nuestra base de datos
    const newPayment = new Payment({
      amount: paymentResult.amount,
      currency: body.currency,
      status: PaymentStatus.PENDING,
      provider: PaymentProvider[body.provider],
      providerPaymentId: paymentResult.providerPaymentId,
      orderId: paymentResult.externalReference,
      metadata: {
        ...body?.metadata,
        orderId: paymentResult.externalReference,
        processorResponse: paymentResult.processorResponse,
        products: body.items?.map(item => ({
          productId: item.id,
          size: item.size || item.metadata?.size,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        }))
      },
      cliente,
    });

    const savedPayment = await newPayment.save();

    return res.status(201).json({
      id: savedPayment._id,
      paymentId: savedPayment.providerPaymentId,
      status: savedPayment.estadoPago,
      redirectUrl: paymentResult.redirectUrl,
    });
  } catch (error) {
    logger.error('Error creating payment:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.findByOrderId = async (req, res) => {
  try {
    const { orderId } = req.params;

    const payment = await paymentService.findByOrderId(orderId);

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    try {
      const paymentIds = {
        transactionId: payment.transactionId,
        providerPaymentId: payment.providerPaymentId,
        orderId: payment.orderId,
      };

      if (payment?.metadata?.refundDetails && payment.proveedor === "STRIPE") {
        return res.json({
          id: payment._id,
          status: payment.estadoPago,
          orderId: payment.orderId,
          transactionId: payment.transactionId,
          providerPaymentId: payment.providerPaymentId,
          provider: payment.proveedor,
          amount: payment.monto,
          currency: payment.moneda,
          clienteId: payment.cliente?._id || null,
          createdAt: payment.createdAt,
          processorResponse: payment.metadata.processorResponse,
        });
      }

      // Obtener el estado más reciente del proveedor de pagos
      const status = await paymentService.getPaymentDetails(paymentIds, payment.proveedor);

      // Actualizar nuestro registro de pago si el estado ha cambiado
      if (payment.estadoPago !== status) {
        payment.estadoPago = status;
        payment.transactionId = payment.transactionId;
        await payment.save();
      }

      return res.json({
        id: payment._id,
        status: payment.estadoPago,
        orderId: payment.orderId,
        transactionId: payment.transactionId,
        providerPaymentId: payment.providerPaymentId,
        provider: payment.proveedor,
        amount: payment.monto,
        currency: payment.moneda,
        clienteId: payment.cliente?._id || null,
        createdAt: payment.createdAt,
        processorResponse: payment.metadata?.processorResponse,
      });
    } catch (error) {
      throw new PaymentProviderError(payment.proveedor, error);
    }
  } catch (error) {
    logger.error('Error finding payment:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.refund = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { amount } = req.body;

    const payment = await paymentService.findByOrderId(orderId);

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    if (payment.estadoPago !== PaymentStatus.APPROVED) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid payment status: ${payment.estadoPago}. Expected: ${PaymentStatus.APPROVED}` 
      });
    }

    try {
      // Actualizar el monto del pago si se proporciona
      if (amount) {
        payment.monto = amount;
      }

      const refundResult = await paymentService.refundPayment(payment);

      // Verificar que el reembolso esté en un estado válido
      if (!["APPROVED", "PENDING", "REFUNDED"].includes(refundResult.status)) {
        throw new Error(`Refund status is ${refundResult.status}`);
      }

      // Actualizar el pago en la base de datos
      payment.estadoPago = PaymentStatus.REFUNDED;
      payment.metadata = {
        ...payment.metadata,
        refundDetails: {
          id: refundResult.refundId,
          amount: amount || payment.monto,
          currency: payment.moneda,
          date: new Date().toISOString(),
          status: refundResult.status,
        },
      };
      
      await payment.save();

      return res.json({
        id: payment._id,
        status: payment.estadoPago,
        refundId: refundResult.refundId,
        refundAmount: amount || payment.monto,
        refundStatus: refundResult.status,
      });
    } catch (error) {
      throw new PaymentProviderError(payment.proveedor, error);
    }
  } catch (error) {
    logger.error('Error refunding payment:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getRefunds = async (req, res) => {
  try {
    const { orderId } = req.params;

    const payment = await paymentService.findByOrderId(orderId);

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    try {
      const paymentIds = {
        transactionId: payment.transactionId,
        providerPaymentId: payment.providerPaymentId,
        orderId: payment.orderId,
        payment_intent: payment.metadata?.webhookData?.payment_intent,
      };

      const refundsResult = await paymentService.getRefunds(paymentIds, payment.proveedor);

      // Si encuentra el reembolso y no está registrado, actualiza el pago
      if (
        refundsResult &&
        refundsResult.refunds.length > 0 &&
        !payment.metadata.refundDetails
      ) {
        const [latestRefund] = refundsResult.refunds;

        // Actualizar el pago en la base de datos con los detalles del reembolso
        payment.estadoPago = PaymentStatus.REFUNDED;
        payment.metadata = {
          ...payment.metadata,
          refundDetails: {
            id: latestRefund.id,
            amount: latestRefund.amount,
            date: latestRefund.dateCreated.toISOString(),
            status: latestRefund.status,
            metadata: latestRefund.metadata,
          },
        };
        
        await payment.save();
      }

      return res.json({
        paymentId: payment._id,
        refunds: refundsResult.refunds.map((refund) => ({
          ...refund,
          paymentId: payment._id,
        })),
      });
    } catch (error) {
      throw new PaymentProviderError(payment.proveedor, error);
    }
  } catch (error) {
    logger.error('Error getting refunds:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getRefund = async (req, res) => {
  try {
    const { orderId, refundId } = req.params;

    const payment = await paymentService.findByOrderId(orderId);

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    // Verificamos que el pago tenga un reembolso registrado
    if (!payment.metadata.refundDetails) {
      return res.status(404).json({ success: false, message: `No refund has been recorded for payment ${orderId}` });
    }

    try {
      const paymentIds = {
        transactionId: payment.transactionId,
        providerPaymentId: payment.providerPaymentId,
        orderId: payment.orderId,
        payment_intent: payment.metadata?.webhookData?.payment_intent,
        refundId: payment.metadata.refundDetails.id,
      };

      const refundResult = await paymentService.getRefund(paymentIds, payment.proveedor);

      return res.json({
        id: refundResult.id,
        paymentId: payment._id,
        amount: refundResult.amount,
        status: refundResult.status,
        dateCreated: refundResult.dateCreated,
        metadata: refundResult.metadata,
      });
    } catch (error) {
      throw new PaymentProviderError(payment.proveedor, error);
    }
  } catch (error) {
    logger.error('Error getting refund:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.processWebhook = async (req, res) => {
  try {
    const signature = req.headers["stripe-signature"];
    let body = req.body;
    let provider = PaymentProvider.MERCADO_PAGO;

    if (signature) {
      body = req.rawBody; // Raw body should be available from middleware
      provider = PaymentProvider.STRIPE;
    }

    const result = await paymentService.processWebhook({
      payload: body,
      signature,
      provider,
    });

    if (result) {
      await paymentService.updatePaymentFromWebhook(result);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    logger.error("Error processing webhook:", error);

    // Manejo de errores específicos
    if (error instanceof PaymentProviderError) {
      res.status(502).json({ success: false, message: error.message });
    } else if (error instanceof PaymentNotFoundError) {
      res.status(404).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

exports.findAll = async (req, res) => {
  try {
    const result = await paymentService.findAll(req.query);

    return res.json({
      data: result.results,
      meta: {
        pagination: {
          page: result.pagination.page,
          pageSize: result.pagination.pageSize,
          pageCount: result.pagination.pageCount,
          total: result.pagination.total,
        },
      },
    });
  } catch (error) {
    logger.error('Error finding all payments:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.findByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await paymentService.findByUserId(userId, req.query);

    return res.json({
      data: result.results,
      meta: {
        pagination: {
          page: result.pagination.page,
          pageSize: result.pagination.pageSize,
          pageCount: result.pagination.pageCount,
          total: result.pagination.total,
        },
      },
    });
  } catch (error) {
    if (error.message === "Usuario no encontrado") {
      return res.status(404).json({ success: false, message: "Usuario no encontrado" });
    }
    
    logger.error('Error finding user payments:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};