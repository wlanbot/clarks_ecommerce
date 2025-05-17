const MercadoPagoAdapter = require('./MercadoPagoAdapter');
const StripeAdapter = require('./stripeAdapter');
const { PaymentProvider } = require('../utils/constants');

class PaymentProviderFactory {
    constructor() { }

    getProvider(provider) {
        switch (provider) {
            case PaymentProvider.MERCADO_PAGO:
                return new MercadoPagoAdapter();
            case PaymentProvider.STRIPE:
                return new StripeAdapter();
            default:
                throw new Error(`Payment provider ${provider} not supported`);
        }
    }
}

module.exports = {
    PaymentProviderFactory,
    MercadoPagoAdapter,
    StripeAdapter
};