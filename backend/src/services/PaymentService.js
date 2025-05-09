const paymentProviderFactory = require('../factories/PaymentProviderFactory');
const paymentRepository = require('../repositories/PaymentRepository');
const { PaymentProviderError } = require('../utils/paymentErrors');
const { PaymentProvider } = require('../models/enums');

class PaymentService {
  constructor() {
    this.logger = console;
  }

  async createPayment(options) {
    try {
      const provider = paymentProviderFactory.getProvider(options.provider);
      return await provider.createPayment(options);
    } catch (error) {
      this.logger.error(
        `Error creating payment with provider ${options.provider}`,
        error
      );
      throw new PaymentProviderError(options.provider, error);
    }
  }

  async getPaymentDetails(paymentIds, provider) {
    try {
      const providerAdapter = paymentProviderFactory.getProvider(provider);
      return await providerAdapter.getPaymentDetails(paymentIds);
    } catch (error) {
      this.logger.error(
        `Error getting payment status for ${paymentIds.orderId}`,
        error
      );
      throw new PaymentProviderError(provider, error);
    }
  }

  async refundPayment(payment) {
    try {
      const provider = paymentProviderFactory.getProvider(payment.provider);
      const paymentIds = {
        transactionId: payment.transactionId,
        providerPaymentId: payment.providerPaymentId,
        orderId: payment.orderId,
        payment_intent: payment.metadata.webhookData?.payment_intent,
      };

      const refundResult = await provider.refundPayment({
        paymentIds,
        amount: payment.amount.amount,
        customerId: payment.metadata.customerId,
      });

      return refundResult;
    } catch (error) {
      this.logger.error(
        `Error refunding payment ${payment.orderId}`,
        error.message
      );
      throw new PaymentProviderError(payment.provider, error);
    }
  }

  async processWebhook(payload) {
    try {
      const provider = paymentProviderFactory.getProvider(payload.provider);
      return await provider.processWebhook(payload);
    } catch (error) {
      this.logger.error('Error processing webhook', error);
      throw new PaymentProviderError(payload.provider || 'Unknown', error);
    }
  }

  async getRefunds(paymentIds, provider) {
    try {
      const providerAdapter = paymentProviderFactory.getProvider(provider);
      return await providerAdapter.getRefunds(paymentIds);
    } catch (error) {
      this.logger.error(
        `Error getting refunds for payment ${paymentIds.orderId}`,
        error
      );
      throw new PaymentProviderError(provider, error);
    }
  }

  async getRefund(paymentIds, provider) {
    try {
      const providerAdapter = paymentProviderFactory.getProvider(provider);
      return await providerAdapter.getRefund(paymentIds);
    } catch (error) {
      this.logger.error(
        `Error getting refund ${paymentIds.refundId} for payment ${paymentIds.orderId}`,
        error
      );
      throw new PaymentProviderError(provider, error);
    }
  }
}

module.exports = new PaymentService();