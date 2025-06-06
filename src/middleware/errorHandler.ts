import { NextFunction, Request, Response } from "express";
import config from "../config";
import { AppError, AsyncHandler, ErrorResponse } from "../types/interfaces";
// DON'T import logger at the top level to avoid circular imports

// Lazy logger function to avoid circular imports
function getLogger() {
  try {
    return require("../utils/logger").default || require("../utils/logger");
  } catch (error) {
    console.error("Failed to load logger in errorHandler:", error);
    return {
      info: (msg: string, meta?: any) =>
        console.log(`[INFO] ${msg}`, meta || ""),
      error: (msg: string, meta?: any) =>
        console.error(`[ERROR] ${msg}`, meta || ""),
      warn: (msg: string, meta?: any) =>
        console.warn(`[WARN] ${msg}`, meta || ""),
      debug: (msg: string, meta?: any) =>
        console.debug(`[DEBUG] ${msg}`, meta || ""),
    };
  }
}

/**
 * Global error handler middleware
 * @param err - Error object
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Next middleware function
 */
export function errorHandler(err: AppError, req: Request, res: Response): void {
  // Log the error with safe logger access
  try {
    const logger = getLogger();
    if (logger && typeof logger.error === "function") {
      logger.error("Unhandled error:", {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      });
    } else {
      console.error("Unhandled error:", {
        error: err.message,
        path: req.path,
        method: req.method,
      });
    }
  } catch (logError) {
    console.error("Logger error in errorHandler:", logError);
    console.error("Original error:", err.message);
  }

  // Default error response
  let status: number = err.status || err.statusCode || 500;
  let message: string = "Une erreur interne s'est produite";
  let code: string = "INTERNAL_SERVER_ERROR";

  // Handle specific error types
  switch (err.name) {
    case "ValidationError":
      status = 400;
      message = "Données de requête invalides";
      code = "VALIDATION_ERROR";
      break;
    case "UnauthorizedError":
      status = 401;
      message = "Non authentifié";
      code = "UNAUTHORIZED";
      break;
    case "ForbiddenError":
      status = 403;
      message = "Accès interdit";
      code = "FORBIDDEN";
      break;
    case "NotFoundError":
      status = 404;
      message = "Ressource non trouvée";
      code = "NOT_FOUND";
      break;
    case "TimeoutError":
      status = 408;
      message = "Délai d'attente dépassé";
      code = "TIMEOUT";
      break;
    case "ConflictError":
      status = 409;
      message = "Conflit de données";
      code = "CONFLICT";
      break;
    case "PayloadTooLargeError":
      status = 413;
      message = "Données trop volumineuses";
      code = "PAYLOAD_TOO_LARGE";
      break;
    case "TooManyRequestsError":
      status = 429;
      message = "Trop de requêtes";
      code = "TOO_MANY_REQUESTS";
      break;
    default:
      // Keep default values
      break;
  }

  // Prepare error response
  const errorResponse: ErrorResponse = {
    error: message,
    code,
    timestamp: new Date().toISOString(),
  };

  // Include additional details in development
  if (config.nodeEnv === "development") {
    errorResponse.details = {
      message: err.message,
      ...(err.stack && { stack: err.stack }),
    };
  }

  res.status(status).json(errorResponse);
}

/**
 * 404 handler middleware
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Next middleware function
 */
export function notFoundHandler(req: Request, res: Response): void {
  // Log with safe logger access
  try {
    const logger = getLogger();
    if (logger && typeof logger.warn === "function") {
      logger.warn("404 Not Found:", {
        path: req.path,
        method: req.method,
        ip: req.ip,
      });
    } else {
      console.warn("404 Not Found:", {
        path: req.path,
        method: req.method,
      });
    }
  } catch (logError) {
    console.error("Logger error in notFoundHandler:", logError);
    console.warn("404 Not Found:", req.path);
  }

  const errorResponse: ErrorResponse = {
    error: "Route non trouvée",
    code: "NOT_FOUND",
    timestamp: new Date().toISOString(),
  };

  res.status(404).json(errorResponse);
}

/**
 * Async error wrapper
 * @param fn - Async function to wrap
 * @returns Wrapped function
 */
export function asyncErrorHandler<T = any>(
  fn: AsyncHandler<T>
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Create custom error with status code
 * @param message - Error message
 * @param status - HTTP status code
 * @param code - Error code
 * @returns Custom error object
 */
export function createError(
  message: string,
  status: number = 500,
  code: string = "INTERNAL_ERROR"
): AppError {
  const error = new Error(message) as AppError;
  error.status = status;
  error.code = code;
  return error;
}

/**
 * Validation error creator
 * @param message - Error message
 * @returns Validation error
 */
export function createValidationError(
  message: string = "Données invalides"
): AppError {
  const error = createError(message, 400, "VALIDATION_ERROR");
  error.name = "ValidationError";
  return error;
}

/**
 * Authorization error creator
 * @param message - Error message
 * @returns Authorization error
 */
export function createUnauthorizedError(
  message: string = "Non authentifié"
): AppError {
  const error = createError(message, 401, "UNAUTHORIZED");
  error.name = "UnauthorizedError";
  return error;
}

/**
 * Forbidden error creator
 * @param message - Error message
 * @returns Forbidden error
 */
export function createForbiddenError(
  message: string = "Accès interdit"
): AppError {
  const error = createError(message, 403, "FORBIDDEN");
  error.name = "ForbiddenError";
  return error;
}

/**
 * Not found error creator
 * @param message - Error message
 * @returns Not found error
 */
export function createNotFoundError(
  message: string = "Ressource non trouvée"
): AppError {
  const error = createError(message, 404, "NOT_FOUND");
  error.name = "NotFoundError";
  return error;
}

/**
 * Timeout error creator
 * @param message - Error message
 * @returns Timeout error
 */
export function createTimeoutError(
  message: string = "Délai dépassé"
): AppError {
  const error = createError(message, 408, "TIMEOUT");
  error.name = "TimeoutError";
  return error;
}

// Export all handlers and utilities
export default {
  errorHandler,
  notFoundHandler,
  asyncErrorHandler,
  createError,
  createValidationError,
  createUnauthorizedError,
  createForbiddenError,
  createNotFoundError,
  createTimeoutError,
};
