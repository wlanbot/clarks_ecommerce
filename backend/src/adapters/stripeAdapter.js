const Stripe = require('stripe');
const PaymentProviderAdapter = require('./payment-provider.adapter');
const { PaymentProviderError } = require('../utils/paymentErrors');
const config = require('../../config/config');
const logger = require('../utils/logger');
const { PaymentStatus } = require('../models/enums');
class StripeAdapter {
  constructor() {
    this.stripe = new Stripe(config.stripe.secretKey);
  }

  async createPayment(options) {
    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: options.items.map(item => ({
          price_data: {
            currency: options.currency.toLowerCase(),
            product_data: {
              name: item.title,
              description: item.description,
            },
            unit_amount: Math.round(item.unitPrice * 100),
          },
          quantity: item.quantity,
        })),
        mode: 'payment',
        metadata: {
          addressId: options.metadata.addressId,
          shippingAddress: JSON.stringify(options.metadata.shippingAddress),
          orderId: options.metadata.orderId
        },
        success_url: `${options.callbackUrl}/success`,
        cancel_url: `${options.callbackUrl}/cancel`,
        customer_email: options.customerEmail,
      });

      return {
        status: PaymentStatus.PENDING,
        providerPaymentId: session.id,
        redirectUrl: session.url,
        processorResponse: session,
        externalReference: options.externalReference,
        amount: options.amount,
      };
    } catch (error) {
      console.error('Stripe create payment error:', error);
      throw new PaymentProviderError(PaymentProvider.STRIPE, error);
    }
  }

  async getPaymentDetails(paymentIds) {
    try {
      const session = await this.stripe.checkout.sessions.retrieve(
        paymentIds.providerPaymentId
      );

      const statusMap = {
        complete: PaymentStatus.APPROVED,
        expired: PaymentStatus.CANCELLED,
        open: PaymentStatus.PENDING,
      };

      return statusMap[session.status] || PaymentStatus.PENDING;
    } catch (error) {
      console.error('Stripe get payment status error:', error);
      throw new PaymentProviderError(PaymentProvider.STRIPE, error);
    }
  }

  async refundPayment(options) {
    const { payment_intent } = options.paymentIds;
    const { amount } = options;

    try {
      const refund = await this.stripe.refunds.create({
        payment_intent,
        amount: amount ? Math.round(amount * 100) : undefined,
      });

      return {
        id: options.paymentIds.orderId,
        status: this.mapStripeStatus(refund.status),
        refundId: refund.id,
        processorResponse: refund,
      };
    } catch (error) {
      console.error('Stripe refund error:', error.message);
      
      if (error.code === 'charge_already_refunded') {
        return {
          id: options.paymentIds.orderId,
          status: PaymentStatus.REFUNDED,
          refundId: null,
          processorResponse: error.raw,
        };
      }
      
      throw new PaymentProviderError(PaymentProvider.STRIPE, error);
    }
  }

  async processWebhook({ payload, signature }) {
    try {
      if (!signature) {
        throw new Error('Stripe signature is required for webhook verification');
      }

      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
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
        provider: PaymentProvider.STRIPE,
        ...(metadata?.orderId && { externalReference: metadata.orderId }),
        data: event.data?.object,
      };
    } catch (error) {
      this.logger.error('Stripe webhook verification failed', error);
      throw new PaymentProviderError(PaymentProvider.STRIPE, error);
    }
  }

  async getRefunds(paymentIds) {
    try {
      const refunds = await this.stripe.refunds.list({
        payment_intent: paymentIds.payment_intent,
        limit: 100,
      });

      return {
        paymentId: paymentIds.orderId,
        refunds: refunds.data.map(refund => ({
          id: refund.id,
          amount: refund.amount / 100,
          status: this.mapRefundStatus(refund.status),
          dateCreated: new Date(refund.created * 1000),
          metadata: refund.metadata,
        })),
      };
    } catch (error) {
      console.error('Stripe get refunds error:', error);
      throw new PaymentProviderError(PaymentProvider.STRIPE, error);
    }
  }

  async getRefund(paymentIds) {
    try {
      const refund = await this.stripe.refunds.retrieve(paymentIds.refundId);

      if (refund.payment_intent !== paymentIds.payment_intent) {
        throw new Error(`Refund ${paymentIds.refundId} not found for payment ${paymentIds.orderId}`);
      }

      return {
        id: refund.id,
        amount: refund.amount / 100,
        status: this.mapRefundStatus(refund.status),
        dateCreated: new Date(refund.created * 1000),
        metadata: refund.metadata,
      };
    } catch (error) {
      console.error('Stripe get refund error:', error);
      throw new PaymentProviderError(PaymentProvider.STRIPE, error);
    }
  }

  mapStripeStatus(eventType) {
    const statusMap = {
      'payment_intent.succeeded': PaymentStatus.APPROVED,
      'payment_intent.payment_failed': PaymentStatus.REJECTED,
      'payment_intent.canceled': PaymentStatus.CANCELLED,
      'charge.succeeded': PaymentStatus.APPROVED,
      'charge.failed': PaymentStatus.REJECTED,
      'charge.refunded': PaymentStatus.REFUNDED,
      'checkout.session.completed': PaymentStatus.APPROVED,
      'checkout.session.expired': PaymentStatus.CANCELLED,
    };

    return statusMap[eventType] || PaymentStatus.PENDING;
  }

  mapRefundStatus(status) {
    const statusMap = {
      succeeded: PaymentStatus.APPROVED,
      pending: PaymentStatus.PENDING,
      failed: PaymentStatus.REJECTED,
      canceled: PaymentStatus.CANCELLED,
    };

    return statusMap[status] || PaymentStatus.PENDING;
  }
}

module.exports = StripeAdapter;