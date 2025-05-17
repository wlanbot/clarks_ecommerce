const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authenticate = require('../middleware/auth');

// Crear un nuevo pago
router.post("/payments", paymentController.create);

// Obtener detalles de un pago por orderId
router.get("/payments/:orderId", paymentController.findByOrderId);

// Reembolsar un pago
router.post("/payments/:orderId/refund", authenticate, paymentController.refund);

// Obtener todos los reembolsos de un pago
router.get("/payments/:orderId/refunds", authenticate, paymentController.getRefunds);

// Obtener un reembolso específico
router.get("/payments/refunds/:orderId", authenticate, paymentController.getRefund);

// Webhook de MercadoPago
router.post("/payments/webhook/mercadopago", paymentController.processWebhook);

// Webhook de Stripe (necesita el cuerpo sin procesar)
router.post("/payments/webhook/stripe", express.raw({type: 'application/json'}), paymentController.processWebhook);

// Obtener todos los pagos (con paginación y filtros)
router.get("/payments", authenticate, paymentController.findAll);

// Obtener pagos de un usuario específico
router.get("/payments/user/:userId", authenticate, paymentController.findByUserId);

module.exports = router;