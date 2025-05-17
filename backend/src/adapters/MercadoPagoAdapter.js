const {
  MercadoPagoConfig,
  Payment: MPPayment,
  Preference,
} = require("mercadopago");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const PaymentProviderAdapter = require("./payment-provider.adapter");
const { PaymentProviderError } = require('../utils/paymentErrors');
const config = require('../../config/config');
const logger = require('../utils/logger');

class MercadoPagoAdapter extends PaymentProviderAdapter {
  constructor() {
    super();
    const accessToken = config.mercadopago.accessToken;

    // Initialize MercadoPago SDK
    this.client = new MercadoPagoConfig({
      accessToken,
    });

    // Initialize resources
    this.payment = new MPPayment(this.client);
    this.preference = new Preference(this.client);
  }

  async createPayment(options) {
    const callbackUrl = config.payment.callbackUrl;

    const preferenceData = {
      items: options.items?.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description || "",
        quantity: item.quantity,
        unit_price: item.unitPrice,
        currency_id: options.currency,
      })),
      payer: {
        email: options.customerEmail,
      },
      back_urls: {
        success: `${callbackUrl}/success`,
        failure: `${callbackUrl}/failure`,
        pending: `${callbackUrl}/pending`,
      },
      external_reference: options.externalReference,
      // auto_return: "approved",
      notification_url: config.mercadopago.webhookUrl,
      statement_descriptor: config.payment.statementDescriptor || "Mi Aplicación",
    };

    try {
      const response = await this.preference.create({ body: preferenceData });
      return {
        status: "PENDING",
        providerPaymentId: response.id,
        redirectUrl: response.init_point,
        processorResponse: response,
        externalReference: options.externalReference,
        amount: options.amount
      };
    } catch (error) {
      logger.error("MercadoPago create payment error:", error);
      throw new PaymentProviderError("MercadoPago", error);
    }
  }

  async refundPayment(options) {
    try {
      const { transactionId, orderId } = options.paymentIds;
      const idempotencyKey = uuidv4();
      const url = `https://api.mercadopago.com/v1/payments/${transactionId}/refunds`;
      const body = options.amount ? { amount: options.amount } : {};

      const response = await axios.post(url, body, {
        headers: {
          "Content-Type": "application/json",
          "X-Idempotency-Key": idempotencyKey,
          Authorization: `Bearer ${config.mercadopago.accessToken}`,
        },
      });

      const responseData = response.data;

      return {
        id: orderId,
        status: this.mapStatus(responseData.status),
        refundId: responseData.id.toString(),
        processorResponse: responseData,
      };
    } catch (error) {
      if (error.response) {
        const responseData = error.response.data;
        logger.error("MercadoPago refund error:", responseData);
        throw new PaymentProviderError(
          "MercadoPago",
          new Error(responseData.message || "Failed to process refund")
        );
      } else {
        logger.error("MercadoPago refund error:", error);
        throw new PaymentProviderError("MercadoPago", error);
      }
    }
  }

  async processWebhook(payload) {
    try {
      const { action, topic, resource, data } = payload.payload;
      let paymentId = null;
      let isPaymentNotification = false;

      // Case 1: v1 API format (action + data.id)
      if (action && data && data.id) {
        if (action.startsWith("payment.")) {
          paymentId = data.id;
          isPaymentNotification = true;
          logger.info(`Detected v1 payment webhook, ID: ${paymentId}`);
        }
      }
      // Case 2: v0 API format (resource + topic=payment)
      else if (topic === "payment" && resource) {
        const resourceStr = resource.toString();
        paymentId = resourceStr.includes("/")
          ? resourceStr.substring(resourceStr.lastIndexOf("/") + 1)
          : resourceStr;
        isPaymentNotification = true;
        logger.info(`Detected v0 payment webhook, ID: ${paymentId}`);
      }
      // Case 3: Merchant order notification
      else if (topic === "merchant_order" && resource) {
        const merchantOrderUrl = resource;
        logger.info(`Detected merchant order webhook: ${merchantOrderUrl}`);

        try {
          const merchantOrderId = merchantOrderUrl.substring(
            merchantOrderUrl.lastIndexOf("/") + 1
          );
          const merchantOrder = await this.fetchMerchantOrder(merchantOrderId);

          if (
            merchantOrder &&
            merchantOrder.payments &&
            merchantOrder.payments.length > 0
          ) {
            const results = await Promise.all(
              merchantOrder.payments.map((payment) =>
                this.processPaymentUpdate(payment.id.toString())
              )
            );

            return {
              merchantOrderId,
              paymentResults: results.filter((r) => r !== null),
            };
          } else {
            logger.warn(`Merchant order ${merchantOrderId} has no payments`);
            return null;
          }
        } catch (error) {
          logger.error(
            `Error processing merchant order: ${error.message}`,
            error.stack
          );
          return null;
        }
      }

      // Process payment notification if we extracted a payment ID
      if (isPaymentNotification && paymentId) {
        return await this.processPaymentUpdate(paymentId);
      }

      logger.warn("Unrecognized webhook format");
      return null;
    } catch (error) {
      logger.error("MercadoPago webhook processing error:", error);
      throw new PaymentProviderError("MercadoPago", error);
    }
  }

  async getPaymentDetails(paymentIds) {
    const { transactionId, orderId } = paymentIds;

    if (!transactionId && !orderId) {
      throw new Error("Either transactionId or orderId must be provided");
    }

    if (transactionId) {
      return this.getPaymentByTransactionId(transactionId);
    }

    return this.searchPaymentByOrderId(orderId);
  }

  async getRefunds(paymentIds) {
    try {
      const { transactionId, orderId } = paymentIds;
      const url = `https://api.mercadopago.com/v1/payments/${transactionId}/refunds`;

      const response = await axios.get(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.mercadopago.accessToken}`,
        },
      });

      const responseData = response.data;

      // Mapear los reembolsos al formato común
      const refunds = Array.isArray(responseData)
        ? responseData.map((refund) => ({
            id: refund.id.toString(),
            amount: refund.amount,
            status: this.mapStatus(refund.status),
            dateCreated: new Date(refund.date_created),
            metadata: refund.metadata || {},
          }))
        : [];

      return {
        paymentId: orderId,
        refunds,
      };
    } catch (error) {
      if (error.response) {
        const responseData = error.response.data;
        logger.error("MercadoPago get refunds error:", responseData);
        throw new PaymentProviderError(
          "MercadoPago",
          new Error(responseData.message || "Failed to get refunds")
        );
      } else {
        logger.error("MercadoPago get refunds error:", error);
        throw new PaymentProviderError("MercadoPago", error);
      }
    }
  }

  async getRefund(paymentIds) {
    const { transactionId, refundId } = paymentIds;
    try {
      if (!refundId) {
        throw new Error("refundId must be provided");
      }
      const url = `https://api.mercadopago.com/v1/payments/${transactionId}/refunds/${refundId}`;

      const response = await axios.get(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.mercadopago.accessToken}`,
        },
      });

      const refund = response.data;

      return {
        id: refund.id.toString(),
        amount: refund.amount,
        status: this.mapStatus(refund.status),
        dateCreated: new Date(refund.date_created),
        metadata: refund,
      };
    } catch (error) {
      if (error.response) {
        const responseData = error.response.data;
        logger.error("MercadoPago get refund error:", responseData);

        if (error.response.status === 404) {
          throw new Error(
            `Refund ${refundId} not found for payment ${transactionId}`
          );
        }

        throw new PaymentProviderError(
          "MercadoPago",
          new Error(responseData.message || "Failed to get refund")
        );
      } else {
        logger.error("MercadoPago get refund error:", error);
        throw new PaymentProviderError("MercadoPago", error);
      }
    }
  }

  // Funciones auxiliares
  async getPaymentByTransactionId(transactionId) {
    logger.info(`Fetching payment with transactionId: ${transactionId}`);
    try {
      const response = await this.payment.get({ id: transactionId });
      return this.mapStatus(response.status);
    } catch (error) {
      logger.error(`Error fetching transaction ${transactionId}:`, error);
      return "PENDING";
    }
  }

  async searchPaymentByOrderId(orderId) {
    logger.info(`Searching payment with orderId: ${orderId}`);

    try {
      const searchParams = {
        external_reference: orderId,
        sort: "date_created",
        criteria: "desc",
      };

      const searchResult = await axios.get(
        "https://api.mercadopago.com/v1/payments/search",
        {
          params: searchParams,
          headers: {
            Authorization: `Bearer ${config.mercadopago.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      logger.info(`Search results count: ${searchResult.data.results?.length || 0}`);

      if (!searchResult.data.results?.length) {
        logger.warn(`No payments found for orderId: ${orderId}`);
        return "PENDING";
      }

      const payment = searchResult.data.results[0];
      logger.info(`Found payment ID: ${payment.id}, status: ${payment.status}`);

      return this.mapStatus(payment.status);
    } catch (error) {
      logger.error("Error searching payment:", error);
      return "PENDING";
    }
  }

  mapStatus(mpStatus) {
    const statusMap = {
      pending: "PENDING",
      approved: "APPROVED",
      authorized: "PENDING",
      in_process: "PENDING",
      in_mediation: "PENDING",
      rejected: "REJECTED",
      cancelled: "CANCELLED",
      refunded: "REFUNDED",
      charged_back: "REJECTED",
    };

    return statusMap[mpStatus.toLowerCase()] || "PENDING";
  }

  async processPaymentUpdate(paymentId) {
    try {
      logger.info(`Fetching payment details for ID: ${paymentId}`);
      const payment = await this.payment.get({ id: paymentId });

      if (!payment) {
        logger.warn(`Payment with ID ${paymentId} not found in Mercado Pago`);
        return null;
      }

      const status = this.mapStatus(payment.status);

      return {
        paymentId: payment.id.toString(),
        externalReference: payment.external_reference,
        status,
        amount: payment.transaction_amount,
        currency: payment.currency_id,
        data: payment,
      };
    } catch (error) {
      logger.error(`Error fetching payment ${paymentId} from Mercado Pago:`, error);
      return null;
    }
  }

  async fetchMerchantOrder(merchantOrderId) {
    try {
      const url = `https://api.mercadopago.com/merchant_orders/${merchantOrderId}`;

      const response = await axios.get(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.mercadopago.accessToken}`,
        },
      });

      return response.data;
    } catch (error) {
      logger.error(`Unexpected error fetching merchant order ${merchantOrderId}:`, error);
      throw new PaymentProviderError(
        "MercadoPago",
        new Error(`Error fetching merchant order ${merchantOrderId}: ${error.message}`)
      );
    }
  }
}

module.exports = MercadoPagoAdapter;