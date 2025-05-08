const mongoose = require('mongoose');
const { PaymentProvider, PaymentStatus } = require('./enums');

const PaymentSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 3
  },
  status: {
    type: String,
    enum: Object.values(PaymentStatus),
    default: PaymentStatus.PENDING
  },
  provider: {
    type: String,
    enum: Object.values(PaymentProvider),
    required: true
  },
  providerPaymentId: {
    type: String,
    required: true
  },
  transactionId: {
    type: String
  },
  orderId: {
    type: String,
    required: true
  },
  metadata: {
    type: Object,
    default: {}
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Payment', PaymentSchema);