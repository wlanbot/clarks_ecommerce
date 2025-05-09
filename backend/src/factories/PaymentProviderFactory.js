const mercadoPagoAdapter = require('../adapters/MercadoPagoAdapter');
const stripeAdapter = require('../adapters/stripeAdapter');
const { PaymentProvider } = require('../models/enums');

class PaymentProviderFactory {
  getProvider(provider) {
    switch (provider) {
      case PaymentProvider.MERCADO_PAGO:
        return mercadoPagoAdapter;
      case PaymentProvider.STRIPE:
        return stripeAdapter;
      // Agregar más casos para otros proveedores
      default:
        throw new Error(`Payment provider ${provider} not supported`);
    }
  }
}

module.exports = new PaymentProviderFactory();