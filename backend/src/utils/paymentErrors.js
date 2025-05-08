class PaymentError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  getStatusCode() {
    return 500;
  }

  getErrorType() {
    return 'PAYMENT_ERROR';
  }

  serializeErrors() {
    return [{ message: this.message }];
  }
}

class PaymentNotFoundError extends PaymentError {
  constructor(message = 'Payment not found') {
    super(message);
  }

  getStatusCode() {
    return 404;
  }

  getErrorType() {
    return 'PAYMENT_NOT_FOUND';
  }
}

class InvalidPaymentStatusError extends PaymentError {
  constructor(currentStatus, requiredStatus) {
    const message = requiredStatus 
      ? `Payment status must be ${requiredStatus} but is ${currentStatus}`
      : `Invalid payment status: ${currentStatus}`;
    super(message);
    this.currentStatus = currentStatus;
    this.requiredStatus = requiredStatus;
  }

  getStatusCode() {
    return 400;
  }

  getErrorType() {
    return 'INVALID_PAYMENT_STATUS';
  }
}

class PaymentProviderError extends PaymentError {
  constructor(provider, originalError) {
    const message = `Error communicating with ${provider} payment service${originalError ? `: ${originalError.message}` : ''}`;
    super(message);
    this.provider = provider;
    this.originalError = originalError;
  }

  getStatusCode() {
    return 502;
  }

  getErrorType() {
    return 'PAYMENT_PROVIDER_ERROR';
  }

  serializeErrors() {
    return [{
      message: this.message,
      ...(this.originalError && { details: this.originalError.message })
    }];
  }
}

class PaymentValidationError extends PaymentError {
  constructor(validationErrors) {
    super('Payment validation failed');
    this.validationErrors = validationErrors;
  }

  getStatusCode() {
    return 400;
  }

  getErrorType() {
    return 'PAYMENT_VALIDATION_ERROR';
  }

  serializeErrors() {
    return this.validationErrors;
  }
}

module.exports = {
  PaymentError,
  PaymentNotFoundError,
  InvalidPaymentStatusError,
  PaymentProviderError,
  PaymentValidationError
};