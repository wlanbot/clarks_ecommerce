class PaymentProviderAdapter {
  async createPayment(options) {}
  async processWebhook(payload) {}
  async refundPayment(options) {}
  async getPaymentDetails(paymentIds) {}
  async getRefunds(paymentIds) {}
  async getRefund(paymentIds) {}
}

module.exports = PaymentProviderAdapter;