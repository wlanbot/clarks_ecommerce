const { PaymentStatus } = require('../models/enums');
const Money = require('../valueObjects/Money');

class Payment {
  constructor(data) {
    this.id = data.id;
    this.amount = data.amount instanceof Money 
      ? data.amount 
      : new Money(data.amount, data.currency);
    this.status = data.status;
    this.provider = data.provider;
    this.providerPaymentId = data.providerPaymentId;
    this.transactionId = data.transactionId;
    this.orderId = data.orderId || (data.metadata && data.metadata.orderId);
    this.metadata = data.metadata || {};
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.events = [];
  }

  approve() {
    if (this.status !== PaymentStatus.PENDING) {
      throw new Error(`Payment must be PENDING to be approved`);
    }
    this.status = PaymentStatus.APPROVED;
    this.updatedAt = new Date();
    this.events.push({
      type: 'PaymentApproved',
      paymentId: this.id,
      amount: this.amount.amount,
      orderId: this.orderId
    });
  }

  canBeRefunded() {
    return this.status === PaymentStatus.APPROVED;
  }

  markAsRefunded(refundId, processorResponse) {
    if (!this.canBeRefunded()) {
      throw new Error('Only approved payments can be refunded');
    }
    this.status = PaymentStatus.REFUNDED;
    this.updatedAt = new Date();
    this.metadata = {
      ...this.metadata,
      refundDetails: {
        id: refundId,
        amount: this.amount.amount,
        date: new Date().toISOString(),
        status: 'REFUNDED'
      },
      processorResponse
    };
    this.events.push({
      type: 'PaymentRefunded',
      paymentId: this.id,
      refundId
    });
  }

  getUncommittedEvents() {
    return this.events;
  }

  clearEvents() {
    this.events = [];
  }
}

module.exports = Payment;