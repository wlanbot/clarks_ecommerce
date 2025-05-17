const PaymentProvider = {
  MERCADO_PAGO: "MERCADO_PAGO",
  STRIPE: "STRIPE",
};

const PaymentStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  REFUNDED: "REFUNDED",
  CANCELLED: "CANCELLED",
};

module.exports = {
  PaymentProvider,
  PaymentStatus
};