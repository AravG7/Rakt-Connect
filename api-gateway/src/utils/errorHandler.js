/**
 * Rakt-Connect Centralized Error Handler
 * Aligned with ABDM sandbox standard codes and STQC requirements.
 */

const logger = require('winston');

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  
  // FHIR standard error mapping
  const fhirError = {
    resourceType: "OperationOutcome",
    issue: [
      {
        severity: statusCode >= 500 ? "error" : "warning",
        code: err.fhirCode || "processing",
        details: {
          text: err.message || "Internal Server Error"
        },
        diagnostics: process.env.NODE_ENV === 'development' ? err.stack : undefined
      }
    ]
  };

  logger.error(`[${req.method}] ${req.originalUrl} - ${statusCode} - ${err.message}`, {
    ip: req.ip,
    fhirError
  });

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message: err.message || 'An unexpected error occurred',
    fhirResponse: fhirError
  });
};

module.exports = errorHandler;
