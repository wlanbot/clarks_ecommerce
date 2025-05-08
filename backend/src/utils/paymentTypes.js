/**
 * @typedef {Object} CreatePaymentOptions
 * @property {number} amount - Monto del pago
 * @property {string} currency - Código de moneda (3 letras)
 * @property {string} description - Descripción del pago
 * @property {string} [callbackUrl] - URL de retorno después del pago
 * @property {Object} [metadata] - Metadatos adicionales
 * @property {string} [customerEmail] - Email del cliente
 * @property {string} provider - Proveedor de pago (MERCADO_PAGO, STRIPE, etc.)
 * @property {Array<Object>} [items] - Ítems del pago
 */

/**
 * @typedef {Object} PaymentIds
 * @property {string} [transactionId] - ID de transacción
 * @property {string} [providerPaymentId] - ID del pago en el proveedor
 * @property {string} [orderId] - ID de la orden
 * @property {string} [payment_intent] - ID de payment intent (Stripe)
 * @property {string} [refundId] - ID del reembolso
 */

/**
 * @typedef {Object} PaymentResult
 * @property {string} id - ID del pago
 * @property {string} status - Estado del pago
 * @property {string} providerPaymentId - ID del pago en el proveedor
 * @property {string} [redirectUrl] - URL de redirección para completar el pago
 * @property {Object} [processorResponse] - Respuesta completa del procesador
 */

/**
 * @typedef {Object} RefundOptions
 * @property {PaymentIds} paymentIds - IDs relacionados con el pago
 * @property {number} [amount] - Monto a reembolsar (si no se especifica, se reembolsa todo)
 * @property {string} [customerId] - ID del cliente
 */

/**
 * @typedef {Object} RefundResult
 * @property {string} id - ID del reembolso
 * @property {string} status - Estado del reembolso
 * @property {string} refundId - ID del reembolso en el proveedor
 * @property {Object} [processorResponse] - Respuesta completa del procesador
 */

/**
 * @typedef {Object} RefundDetail
 * @property {string} id - ID del reembolso
 * @property {number} amount - Monto reembolsado
 * @property {string} status - Estado del reembolso
 * @property {Date} dateCreated - Fecha de creación
 * @property {Object} [metadata] - Metadatos adicionales
 */

/**
 * @typedef {Object} RefundsList
 * @property {string} paymentId - ID del pago
 * @property {Array<RefundDetail>} refunds - Lista de reembolsos
 */

module.exports = {};