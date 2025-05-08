require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 4000,
  MONGO_URI: process.env.MONGO_URI || "mongodb+srv://alanjoseruizc:qwerty123@cluster0.sytpa7l.mongodb.net/e-commerce",
  JWT_SECRET: process.env.JWT_SECRET || "secret_ecom",
  MERCADO_PAGO_ACCESS_TOKEN: process.env.MERCADO_PAGO_ACCESS_TOKEN,
  MERCADO_PAGO_WEBHOOK_URL: process.env.MERCADO_PAGO_WEBHOOK_URL,
  STRIPE_ACCESS_TOKEN: process.env.STRIPE_ACCESS_TOKEN,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  PAYMENT_CALLBACK_SUCCESS_URL: process.env.PAYMENT_CALLBACK_SUCCESS_URL,
  PAYMENT_CALLBACK_CANCEL_URL: process.env.PAYMENT_CALLBACK_CANCEL_URL,
  PAYMENT_STATEMENT_DESCRIPTOR: process.env.PAYMENT_STATEMENT_DESCRIPTOR || 'Mi Aplicación'
};