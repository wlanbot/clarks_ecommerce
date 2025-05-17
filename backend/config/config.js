require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 4000,
  MONGO_URI: process.env.MONGO_URI || "mongodb+srv://alanjoseruizc:qwerty123@cluster0.sytpa7l.mongodb.net/e-commerce",
  JWT_SECRET: process.env.JWT_SECRET || "secret_ecom",
  mercadopago:{
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN,
    webhookUrl: process.env.MERCADO_PAGO_WEBHOOK_URL,
  },
  stripe:{
    secretKey: process.env.STRIPE_ACCESS_TOKEN,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },
  payment:{
    callbackUrl: process.env.PAYMENT_CALLBACK_URL,
    callbackSuccessUrl: process.env.PAYMENT_CALLBACK_SUCCESS_URL,
    callbackCancelUrl: process.env.PAYMENT_CALLBACK_CANCEL_URL,
    statementDescriptor: process.env.PAYMENT_STATEMENT_DESCRIPTOR || 'Mi Tienda'
  }
};