/**
 * Format error messages consistently
 * @param {Error} error - The error object
 * @param {String} defaultMessage - Default message if none provided
 * @returns {Object} Formatted error response
 */
exports.formatErrorResponse = (error, defaultMessage = "Error en el servidor") => {
  return {
    success: false,
    message: error.message || defaultMessage,
    error: process.env.NODE_ENV === "development" ? error.stack : undefined
  };
};

/**
 * Format success responses consistently
 * @param {String} message - Success message
 * @param {Object} data - Optional data to include
 * @returns {Object} Formatted success response
 */
exports.formatSuccessResponse = (message, data = {}) => {
  return {
    success: true,
    message,
    ...data
  };
};

/**
 * Validate required fields in a request
 * @param {Object} body - Request body
 * @param {Array} requiredFields - Array of field names that are required
 * @returns {Object|null} Error object if validation fails, null if passes
 */
exports.validateRequiredFields = (body, requiredFields) => {
  const missingFields = requiredFields.filter(field => !body[field]);
  
  if (missingFields.length > 0) {
    return {
      success: false,
      message: `Faltan campos requeridos: ${missingFields.join(', ')}`
    };
  }
  
  return null;
};