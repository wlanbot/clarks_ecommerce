const PaymentModel = require('../models/Payment');
const Payment = require('../entities/Payment');
const Money = require('../valueObjects/Money');
const { PaymentNotFoundError } = require('../utils/paymentErrors');

class PaymentRepository {
  async create(payment) {
    try {
      const paymentData = {
        amount: payment.amount.amount,
        currency: payment.amount.currency,
        status: payment.status,
        provider: payment.provider,
        providerPaymentId: payment.providerPaymentId,
        transactionId: payment.transactionId,
        orderId: payment.orderId,
        metadata: payment.metadata || {}
      };

      const newPayment = new PaymentModel(paymentData);
      const savedPayment = await newPayment.save();
      
      return this.toDomain(savedPayment);
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  }

  async update(id, paymentData) {
    try {
      const updateData = {};
      
      if (paymentData.status) updateData.status = paymentData.status;
      if (paymentData.transactionId) updateData.transactionId = paymentData.transactionId;
      if (paymentData.updatedAt) updateData.updatedAt = paymentData.updatedAt;
      if (paymentData.metadata) updateData.metadata = paymentData.metadata;
      
      const updatedPayment = await PaymentModel.findByIdAndUpdate(
        id, 
        updateData,
        { new: true }
      );
      
      if (!updatedPayment) {
        throw new PaymentNotFoundError();
      }
      
      return this.toDomain(updatedPayment);
    } catch (error) {
      console.error(`Error updating payment ${id}:`, error);
      throw error;
    }
  }

  async findById(id) {
    try {
      const payment = await PaymentModel.findById(id);
      if (!payment) return null;
      return this.toDomain(payment);
    } catch (error) {
      console.error(`Error finding payment by ID ${id}:`, error);
      throw error;
    }
  }

  async findByProviderPaymentId(providerId, provider) {
    try {
      const payment = await PaymentModel.findOne({
        providerPaymentId: providerId,
        provider
      });
      if (!payment) return null;
      return this.toDomain(payment);
    } catch (error) {
      console.error(`Error finding payment by provider ID ${providerId}:`, error);
      throw error;
    }
  }

  async findByTransactionId(transactionId) {
    try {
      const payment = await PaymentModel.findOne({ transactionId });
      if (!payment) return null;
      return this.toDomain(payment);
    } catch (error) {
      console.error(`Error finding payment by transaction ID ${transactionId}:`, error);
      throw error;
    }
  }

  async findByOrderId(orderId) {
    try {
      const payment = await PaymentModel.findOne({ orderId });
      if (!payment) return null;
      return this.toDomain(payment);
    } catch (error) {
      console.error(`Error finding payment by order ID ${orderId}:`, error);
      throw error;
    }
  }

  // Convertir documento Mongoose a objeto de dominio
  toDomain(paymentModel) {
    return new Payment({
      id: paymentModel._id.toString(),
      amount: new Money(paymentModel.amount, paymentModel.currency),
      status: paymentModel.status,
      provider: paymentModel.provider,
      providerPaymentId: paymentModel.providerPaymentId,
      transactionId: paymentModel.transactionId,
      orderId: paymentModel.orderId,
      metadata: paymentModel.metadata,
      createdAt: paymentModel.createdAt,
      updatedAt: paymentModel.updatedAt
    });
  }
}

module.exports = new PaymentRepository();