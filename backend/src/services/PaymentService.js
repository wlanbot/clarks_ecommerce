const { v4: uuidv4 } = require('uuid');
const Payment = require('../models/Payment');
const User = require('../models/User');
const Product = require('../models/Product');
const { PaymentProviderFactory } = require('../adapters');
const { PaymentProvider, PaymentStatus } = require('../utils/constants');
const { PaymentProviderError, PaymentNotFoundError } = require('../utils/paymentErrors');
const Money = require('../utils/Money');
const logger = require('../utils/logger');

class PaymentService {
  constructor() {
    this.paymentProviderFactory = new PaymentProviderFactory();
  }

  async findByOrderId(orderId) {
    return await Payment.findOne({ orderId }).populate('cliente');
  }

  async findByProviderPaymentId(providerId) {
    return await Payment.findOne({ providerPaymentId: providerId }).populate('cliente');
  }

  async findByTransactionId(transactionId) {
    return await Payment.findOne({ transactionId }).populate('cliente');
  }

  async createPayment(options) {
    try {
      // Calcular el monto total
      const amount = this.calculateTotalAmount(options.items);

      // Generar un orderId único
      const orderId = await this.generateUniqueOrderId();

      const body = {
        ...options,
        externalReference: orderId,
        amount: amount,
        metadata: {
          ...options.metadata,
          orderId: orderId
        }
      };

      const provider = this.paymentProviderFactory.getProvider(options.provider);
      return await provider.createPayment(body);
    } catch (error) {
      logger.error(`Error creating payment with provider ${options.provider}`, error);
      throw new PaymentProviderError(options.provider, error);
    }
  }

  async getPaymentDetails(paymentIds, provider) {
    try {
      const providerAdapter = this.paymentProviderFactory.getProvider(provider);
      return await providerAdapter.getPaymentDetails(paymentIds);
    } catch (error) {
      logger.error(`Error getting payment status for ${paymentIds.orderId}`, error);
      throw new PaymentProviderError("Unknown", error);
    }
  }

  async refundPayment(payment) {
    try {
      const provider = this.paymentProviderFactory.getProvider(payment.proveedor);

      const paymentIds = {
        transactionId: payment.transactionId,
        providerPaymentId: payment.providerPaymentId,
        orderId: payment.orderId,
        payment_intent: payment.metadata?.webhookData?.payment_intent,
      };

      const money = new Money(payment.monto, payment.moneda);

      const refundResult = await provider.refundPayment({
        paymentIds,
        amount: money.amount,
      });

      // Actualizar el inventario - Restablecer stock para cada producto
      if (payment.metadata && payment.metadata.products) {
        await this.restoreStock(payment.metadata.products);
      }

      return refundResult;
    } catch (error) {
      logger.error(`Error refunding payment ${payment.orderId}`, error.message);
      throw new PaymentProviderError(payment.provider, error);
    }
  }

  async processWebhook(payload) {
    try {
      const provider = this.paymentProviderFactory.getProvider(payload.provider);
      return await provider.processWebhook(payload);
    } catch (error) {
      logger.error("Error processing webhook", error);
      throw new PaymentProviderError("Unknown", error);
    }
  }

  async getRefunds(paymentIds, provider) {
    try {
      const providerAdapter = this.paymentProviderFactory.getProvider(provider);
      return await providerAdapter.getRefunds(paymentIds);
    } catch (error) {
      logger.error(`Error getting refunds for payment ${paymentIds.orderId}`, error);
      if (error instanceof Error) {
        throw error;
      }
      throw new PaymentProviderError(provider, error);
    }
  }

  async getRefund(paymentIds, provider) {
    try {
      const providerAdapter = this.paymentProviderFactory.getProvider(provider);
      return await providerAdapter.getRefund(paymentIds);
    } catch (error) {
      logger.error(`Error getting refund ${paymentIds.refundId} for payment ${paymentIds.orderId}`, error);
      if (error instanceof Error) {
        throw error;
      }
      throw new PaymentProviderError(provider, error);
    }
  }

  async findAll(query) {
    const {
      page = 1,
      pageSize = 10,
      status,
      provider,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      currency,
      ...restFilters
    } = query;

    // Build filters
    const filters = { ...restFilters };
    if (status) {
      filters.estadoPago = status;
    }
    if (provider) {
      filters.proveedor = provider;
    }
    
    if (startDate || endDate) {
      filters.createdAt = {};
      if (startDate) filters.createdAt.$gte = new Date(startDate);
      if (endDate) filters.createdAt.$lte = new Date(endDate);
    }
    
    if (minAmount || maxAmount) {
      filters.monto = {};
      if (minAmount) filters.monto.$gte = minAmount;
      if (maxAmount) filters.monto.$lte = maxAmount;
    }
    
    if (currency) {
      filters.moneda = currency;
    }

    // Count total documents
    const total = await Payment.countDocuments(filters);
    
    // Get paginated results
    const payments = await Payment.find(filters)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .populate('cliente');

    return {
      results: payments,
      pagination: {
        page,
        pageSize,
        pageCount: Math.ceil(total / pageSize),
        total,
      },
    };
  }

  async findByUserId(documentId, query) {
    const { page = 1, pageSize = 10, status, startDate, endDate } = query;

    // Check if user exists using documentId
    const user = await User.findOne({ documentId });

    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    // Build filters
    const filters = { cliente: user._id };

    if (status) {
      filters.estadoPago = status;
    }

    if (startDate || endDate) {
      filters.createdAt = {};
      if (startDate) filters.createdAt.$gte = new Date(startDate);
      if (endDate) filters.createdAt.$lte = new Date(endDate);
    }

    // Count total documents
    const total = await Payment.countDocuments(filters);
    
    // Get paginated results
    const payments = await Payment.find(filters)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .populate('cliente');

    return {
      results: payments,
      pagination: {
        page,
        pageSize,
        pageCount: Math.ceil(total / pageSize),
        total,
      },
    };
  }

  async updatePaymentFromWebhook(processedHook) {
    if (!processedHook || !processedHook.paymentId) {
      return;
    }

    // Try different strategies to find the payment
    let payment = null;

    // Strategy 1: Find by provider payment ID
    if (processedHook.paymentId) {
      payment = await this.findByProviderPaymentId(processedHook.paymentId);

      if (payment) {
        logger.info(`Found payment by provider ID: ${processedHook.paymentId}`);
      }
    }

    // Strategy 2: Find by external reference (orderId)
    if (!payment && processedHook.externalReference) {
      payment = await this.findByOrderId(processedHook.externalReference);

      if (payment) {
        logger.info(`Found payment by external reference: ${processedHook.externalReference}`);
      }
    }

    // Strategy 3: Find by transactionId
    if (!payment && processedHook.paymentId) {
      payment = await this.findByTransactionId(processedHook.paymentId);

      if (payment) {
        logger.info(`Found payment by transactionId: ${processedHook.paymentId}`);
      }
    }

    // Update payment if found and status has changed
    if (payment && processedHook.status && payment.estadoPago !== processedHook.status) {
      logger.info(`Updating payment ${payment._id} status from ${payment.estadoPago} to ${processedHook.status}`);

      // Actualizar las existencias si el estado cambia a APPROVED
      if (processedHook.status === PaymentStatus.APPROVED && 
          payment.estadoPago !== PaymentStatus.APPROVED &&
          payment.metadata && payment.metadata.products) {
        await this.updateStock(payment.metadata.products);
        logger.info('Stock updated for approved payment');
        
        // Añadir a historial de compras del usuario
        if (payment.cliente) {
          await this.addToPurchaseHistory(payment);
          logger.info('Added to user purchase history');
        }
      }
      
      // Restablecer existencias si el estado cambia a REFUNDED o CANCELLED desde APPROVED
      if ((processedHook.status === PaymentStatus.REFUNDED || 
           processedHook.status === PaymentStatus.CANCELLED) && 
          payment.estadoPago === PaymentStatus.APPROVED &&
          payment.metadata && payment.metadata.products) {
        await this.restoreStock(payment.metadata.products);
        logger.info('Stock restored for cancelled/refunded payment');
      }

      const updatedPayment = {
        estadoPago: processedHook.status,
        transactionId: processedHook.paymentId,
        metadata: {
          ...payment.metadata,
          webhookData: processedHook.data,
          lastUpdated: new Date().toISOString(),
        },
      };

      await Payment.findByIdAndUpdate(
        payment._id, 
        updatedPayment,
        { new: true }
      );

      logger.info(`Payment ${payment._id} updated successfully`);
    } else if (!payment) {
      logger.warn(`Payment not found for ID ${processedHook.paymentId}`);
      throw new PaymentNotFoundError();
    } else if (payment.estadoPago === processedHook.status) {
      logger.info(`Payment ${payment._id} status unchanged: ${payment.estadoPago}`);
    }
  }
  
  // Métodos auxiliares
  calculateTotalAmount(items) {
    return items.reduce((total, item) => {
      return total + item.quantity * item.unitPrice;
    }, 0);
  }

  async generateUniqueOrderId() {
    const prefix = "ORD-";
    let isOrderIdUnique = false;
    let orderId;
    
    do {
      const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
      const timestampPart = Date.now().toString(36).toUpperCase();
      orderId = `${prefix}${randomPart}-${timestampPart}`;
      
      const existingPayment = await Payment.findOne({ orderId });
      if (!existingPayment) {
        isOrderIdUnique = true;
      }
    } while (!isOrderIdUnique);
    
    return orderId;
  }
  
  async updateStock(products) {
    for (const product of products) {
      const productDoc = await Product.findOne({ id: product.productId });
      if (!productDoc) {
        logger.warn(`Product not found: ${product.productId}`);
        continue;
      }
      
      const sizeIndex = productDoc.sizes.findIndex(s => s.size === product.size);
      if (sizeIndex === -1) {
        logger.warn(`Size ${product.size} not found for product ${product.productId}`);
        continue;
      }
      
      if (productDoc.sizes[sizeIndex].stock < product.quantity) {
        logger.warn(`Insufficient stock for product ${product.productId} size ${product.size}`);
        continue;
      }
      
      productDoc.sizes[sizeIndex].stock -= product.quantity;
      await productDoc.save();
      logger.info(`Stock updated for product ${product.productId} size ${product.size} (${productDoc.sizes[sizeIndex].stock})`);
    }
  }
  
  async restoreStock(products) {
    for (const product of products) {
      const productDoc = await Product.findOne({ id: product.productId });
      if (!productDoc) {
        logger.warn(`Product not found: ${product.productId}`);
        continue;
      }
      
      const sizeIndex = productDoc.sizes.findIndex(s => s.size === product.size);
      if (sizeIndex === -1) {
        logger.warn(`Size ${product.size} not found for product ${product.productId}`);
        continue;
      }
      
      productDoc.sizes[sizeIndex].stock += product.quantity;
      await productDoc.save();
      logger.info(`Stock restored for product ${product.productId} size ${product.size} (${productDoc.sizes[sizeIndex].stock})`);
    }
  }
  
  async addToPurchaseHistory(payment) {
    if (!payment.cliente || !payment.metadata || !payment.metadata.products) {
      return;
    }
    
    const user = await User.findById(payment.cliente);
    if (!user) {
      logger.warn(`User not found: ${payment.cliente}`);
      return;
    }
    
    const purchase = {
      products: payment.metadata.products.map(product => ({
        productId: product.productId,
        size: product.size,
        quantity: product.quantity
      })),
      total: payment.monto,
      date: new Date()
    };
    
    user.purchaseHistory.push(purchase);
    await user.save();
    logger.info(`Purchase added to history for user ${user._id}`);
    
    // Clear user's cart
    await User.findByIdAndUpdate(
      payment.cliente,
      { cartData: {} }
    );
    logger.info(`Cart cleared for user ${user._id}`);
  }
}

module.exports = new PaymentService();