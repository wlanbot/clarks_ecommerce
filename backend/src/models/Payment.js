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
  },
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Actualizar la fecha de modificación antes de guardar
PaymentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Payment', PaymentSchema);