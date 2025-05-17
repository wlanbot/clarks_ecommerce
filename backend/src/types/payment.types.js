const PaymentProvider = {
  STRIPE: 'STRIPE',
  MERCADO_PAGO: 'MERCADO_PAGO'
};

const PaymentStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  REFUNDED: 'REFUNDED',
  CANCELLED: 'CANCELLED'
};

module.exports = {
  PaymentProvider,
  PaymentStatus
};