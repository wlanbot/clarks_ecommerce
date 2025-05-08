const { PaymentError } = require('../domain/errors/paymentErrors');

function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  // Si es un error personalizado de dominio
  if (err instanceof PaymentError) {
    return res.status(err.getStatusCode()).json({
      success: false,
      error: {
        type: err.getErrorType(),
        messages: err.serializeErrors(),
        timestamp: new Date().toISOString()
      }
    });
  }

  // Errores de validación de Mongoose
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: {
        type: 'VALIDATION_ERROR',
        messages: Object.values(err.errors).map(e => ({
          field: e.path,
          message: e.message
        })),
        timestamp: new Date().toISOString()
      }
    });
  }

  // Error 404 de Mongoose
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return res.status(404).json({
      success: false,
      error: {
        type: 'NOT_FOUND',
        messages: [{ message: 'Resource not found' }],
        timestamp: new Date().toISOString()
      }
    });
  }

  // Error genérico
  return res.status(500).json({
    success: false,
    error: {
      type: 'SERVER_ERROR',
      messages: [{ message: err.message || 'Internal server error' }],
      timestamp: new Date().toISOString()
    }
  });
}

module.exports = errorHandler;