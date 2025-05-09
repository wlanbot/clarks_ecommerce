const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authenticate = require('../middleware/auth');

// POST /api/payments - Crear un nuevo pago
router.post('/', authenticate, paymentController.createPayment);

// GET /api/payments/:id - Obtener estado de un pago
router.get('/:id', authenticate, paymentController.getPaymentStatus);

// POST /api/payments/:id/refund - Reembolsar un pago
router.post('/:id/refund', authenticate, paymentController.refundPayment);

// GET /api/payments/:id/refunds - Obtener lista de reembolsos de un pago
router.get('/:id/refunds', authenticate, paymentController.getRefunds);

// GET /api/payments/refunds/:id - Obtener un reembolso específico
router.get('/refunds/:id', authenticate, paymentController.getRefund);

// Webhooks - No requieren autenticación
router.post('/webhook/mercadopago', paymentController.handleMercadoPagoWebhook);
router.post('/webhook/stripe', express.raw({type: 'application/json'}), paymentController.handleStripeWebhook);

module.exports = router;