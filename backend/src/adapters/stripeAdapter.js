const Stripe = require('stripe');
const { STRIPE_ACCESS_TOKEN, STRIPE_WEBHOOK_SECRET } = require('../../config/config');
const { PaymentProviderError } = require('../utils/paymentErrors');

class StripeAdapter {
  constructor() {
    this.stripe = new Stripe(STRIPE_ACCESS_TOKEN);
    this.logger = console;
  }

  async createPayment(options) {
    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items:
          options.items?.map((item) => ({
            price_data: {
              currency: options.currency.toLowerCase(),
              product_data: {
                name: item.title,
                description: item.description,
              },
              unit_amount: Math.round(item.unitPrice * 100), // Stripe uses cents
            },
            quantity: item.quantity,
          })) || [],
        mode: 'payment',
        success_url: `${options.callbackUrl || process.env.PAYMENT_CALLBACK_SUCCESS_URL}`,
        cancel_url: `${options.callbackUrl || process.env.PAYMENT_CALLBACK_CANCEL_URL}`,
        customer_email: options.customerEmail,
        metadata: options.metadata,
      });

      return {
        id: session.id,
        status: 'PENDING',
        providerPaymentId: session.id,
        redirectUrl: session.url,
        processorResponse: session,
      };
    } catch (error) {
      this.logger.error('Stripe create payment error:', error);
      throw new PaymentProviderError('Stripe', error);
    }
  }

  async getPaymentDetails(paymentIds) {
    try {
      // In Stripe, we would retrieve the session or payment intent
      const { providerPaymentId } = paymentIds;

      const paymentIntent =
        await this.stripe.checkout.sessions.retrieve(providerPaymentId);

      // Map Stripe statuses to our application statuses
      const statusMap = {
        requires_payment_method: 'PENDING',
        requires_confirmation: 'PENDING',
        requires_action: 'PENDING',
        processing: 'PENDING',
        requires_capture: 'PENDING',
        canceled: 'CANCELLED',
        succeeded: 'APPROVED',
        complete: 'APPROVED',
      };

      return statusMap[paymentIntent.status] || 'PENDING';
    } catch (error) {
      this.logger.error('Stripe get payment status error:', error);
      throw new PaymentProviderError('Stripe', error);
    }
  }

  async refundPayment(options) {
    const { orderId, payment_intent } = options.paymentIds;
    const { customerId, amount } = options;
    try {
      // Siguiendo la documentación, Stripe acepta 'charge' o 'payment_intent'
      // El param 'amount' es opcional - si no se proporciona, realiza un reembolso completo
      const bodyRefund = {
        payment_intent,
        amount: amount ? Math.round(amount * 100) : undefined, // Convertir a centavos si existe
        metadata: {
          orderId,
          customerId
        },
      };

      const refund = await this.stripe.refunds.create(bodyRefund);

      return {
        id: orderId,
        status: this.mapStripeStatus(refund.status),
        refundId: refund.id,
        processorResponse: refund,
      };
    } catch (error) {
      this.logger.error('Stripe refund error:', error.message);
      throw new PaymentProviderError('Stripe', error);
    }
  }

  async processWebhook(payload) {
    const signature = payload.signature;
    try {
      if (!signature) {
        throw new Error(
          'Stripe signature is required for webhook verification',
        );
      }
      const event = this.stripe.webhooks.constructEvent(
        payload.payload,
        signature,
        STRIPE_WEBHOOK_SECRET
      );

      // Extraer metadata de manera segura
      const getMetadata = (obj) => {
        return obj && typeof obj === 'object' && 'metadata' in obj
          ? obj.metadata
          : undefined;
      };

      const metadata = getMetadata(event.data?.object);

      return {
        paymentId: event.id,
        status: this.mapStripeStatus(event.type),
        provider: 'STRIPE',
        ...(metadata?.orderId && { externalReference: metadata.orderId }),
        data: event.data?.object,
      };
    } catch (error) {
      this.logger.error('Stripe webhook verification failed', error);
      throw new PaymentProviderError('Stripe', error);
    }
  }

  async getRefunds(paymentIds) {
    try {
      const { payment_intent } = paymentIds;
      // Stripe permite filtrar reembolsos por payment_intent
      const refundsResponse = await this.stripe.refunds.list({
        payment_intent,
        limit: 100, // Ajustar según necesidades
      });

      const refunds = refundsResponse.data.map((refund) => ({
        id: refund.id,
        amount: refund.amount / 100, // Convertir de centavos a unidades
        status: this.mapRefundStatus(refund.status),
        dateCreated: new Date(refund.created * 1000), // Convertir timestamp Unix a Date
        metadata: refund.metadata,
      }));

      return {
        paymentId: payment_intent,
        refunds,
      };
    } catch (error) {
      this.logger.error('Stripe get refunds error:', error);
      throw new PaymentProviderError('Stripe', error);
    }
  }

  async getRefund(paymentIds) {
    try {
      const { payment_intent, refundId } = paymentIds;
      const refund = await this.stripe.refunds.retrieve(refundId);

      // Verificar que el reembolso pertenece al pago indicado
      if (refund.payment_intent !== payment_intent) {
        throw new Error(`Refund ${refundId} not found for payment ${payment_intent}`);
      }

      return {
        id: refund.id,
        amount: refund.amount / 100, // Convertir de centavos a unidades
        status: this.mapRefundStatus(refund.status),
        dateCreated: new Date(refund.created * 1000), // Convertir timestamp Unix a Date
        metadata: refund.metadata,
      };
    } catch (error) {
      this.logger.error('Stripe get refund error:', error);
      throw new PaymentProviderError('Stripe', error);
    }
  }

  // Método auxiliar para mapear estados
  mapStripeStatus(eventType) {
    const statusMap = {
      // Payment Intents
      'payment_intent.succeeded': 'APPROVED',
      'payment_intent.payment_failed': 'REJECTED',
      'payment_intent.canceled': 'CANCELLED',
      'payment_intent.processing': 'PENDING',
      'payment_intent.requires_action': 'PENDING',
      'payment_intent.partially_funded': 'PARTIALLY_PAID',

      // Charges
      'charge.succeeded': 'APPROVED',
      'charge.failed': 'REJECTED',
      'charge.pending': 'PENDING',
      'charge.refunded': 'REFUNDED',
      'charge.dispute.created': 'DISPUTED',
      'charge.dispute.closed': 'DISPUTE_CLOSED',

      // Refunds
      'refund.created': 'REFUND_PENDING',
      'refund.updated': 'REFUND_PENDING',
      'refund.succeeded': 'REFUNDED',
      'refund.failed': 'REFUND_FAILED',
      succeeded: 'REFUNDED',

      // Checkout Sessions
      'checkout.session.completed': 'APPROVED',
      'checkout.session.expired': 'EXPIRED',
      'checkout.session.async_payment_succeeded': 'APPROVED',
      'checkout.session.async_payment_failed': 'REJECTED',

      // Disputes
      'charge.dispute.funds_withdrawn': 'FUNDS_HELD',
      'charge.dispute.funds_reinstated': 'FUNDS_REINSTATED',

      // Subscription statuses
      'customer.subscription.created': 'ACTIVE',
      'customer.subscription.updated': 'ACTIVE',
      'customer.subscription.deleted': 'CANCELLED',
      'customer.subscription.paused': 'PAUSED',
      'customer.subscription.resumed': 'ACTIVE',
      'customer.subscription.trial_will_end': 'TRIAL_ENDS_SOON',
    };

    // Estado por defecto basado en el tipo de evento
    if (!statusMap[eventType]) {
      if (eventType.includes('.succeeded')) return 'APPROVED';
      if (eventType.includes('.failed') || eventType.includes('.canceled'))
        return 'REJECTED';
      if (eventType.includes('.pending') || eventType.includes('.processing'))
        return 'PENDING';
      if (eventType.includes('.refund')) return 'REFUNDED';
    }

    return statusMap[eventType] || 'UNKNOWN';
  }

  mapRefundStatus(status) {
    const statusMap = {
      succeeded: 'APPROVED',
      pending: 'PENDING',
      failed: 'REJECTED',
      canceled: 'CANCELLED',
    };

    return statusMap[status] || 'UNKNOWN';
  }
}

module.exports = new StripeAdapter();