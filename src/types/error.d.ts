// Types d'erreurs étendus pour l'application
export interface ValidationErrorDetail {
  field: string;
  value: unknown;
  message: string;
}

export interface ValidationErrorResponse {
  error: string;
  code: 'VALIDATION_ERROR';
  timestamp: string;
  details: {
    message: string;
    errors: ValidationErrorDetail[];
  };
}

export interface ApiErrorContext {
  path: string;
  method: string;
  ip: string;
  userAgent?: string;
  userId?: string;
  sessionId?: string;
}

// Error codes enum pour une meilleure consistance
export enum ErrorCode {
  // Client errors (4xx)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  PAYLOAD_TOO_LARGE = 'PAYLOAD_TOO_LARGE',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
  
  // Server errors (5xx)
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',
  
  // Application specific errors
  LLAMA_ERROR = 'LLAMA_ERROR',
  FILE_OPERATION_ERROR = 'FILE_OPERATION_ERROR',
  CONFIG_ERROR = 'CONFIG_ERROR',
  MODEL_PARAMS_ERROR = 'MODEL_PARAMS_ERROR',
}

// HTTP status codes enum
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  PAYLOAD_TOO_LARGE = 413,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504,
}

// Type guard pour vérifier si c'est une erreur d'application
export function isAppError(error: unknown): error is import('./interfaces').AppError {
  return error instanceof Error && 'status' in error;
}

// Type guard pour vérifier si c'est une erreur de validation
export function isValidationError(error: unknown): boolean {
  return error instanceof Error && error.name === 'ValidationError';
}

// Utilitaire pour extraire les informations de contexte d'une requête
export function extractErrorContext(req: any): ApiErrorContext {
  return {
    path: req.path || req.url || 'unknown',
    method: req.method || 'unknown',
    ip: req.ip || req.connection?.remoteAddress || 'unknown',
    userAgent: req.get?.('User-Agent'),
    userId: req.user?.id,
    sessionId: req.sessionID,
  };
}

// Interface pour les erreurs métiers spécifiques
export interface BusinessError extends Error {
  code: ErrorCode;
  context?: Record<string, unknown>;
}

// Créateur d'erreur métier
export function createBusinessError(
  message: string,
  code: ErrorCode,
  context?: Record<string, unknown>
): BusinessError {
  const error = new Error(message) as BusinessError;
  error.code = code;
  error.context = context;
  return error;
}

// Erreurs spécifiques au domaine
export class LlamaError extends Error {
  public readonly code = ErrorCode.LLAMA_ERROR;
  
  constructor(message: string, public readonly details?: Record<string, unknown>) {
    super(message);
    this.name = 'LlamaError';
  }
}

export class FileOperationError extends Error {
  public readonly code = ErrorCode.FILE_OPERATION_ERROR;
  
  constructor(message: string, public readonly filename?: string, public readonly operation?: string) {
    super(message);
    this.name = 'FileOperationError';
  }
}

export class ModelParamsError extends Error {
  public readonly code = ErrorCode.MODEL_PARAMS_ERROR;
  
  constructor(message: string, public readonly invalidParams?: string[]) {
    super(message);
    this.name = 'ModelParamsError';
  }
}

// Export de tous les types et utilitaires
export default {
  ErrorCode,
  HttpStatus,
  isAppError,
  isValidationError,
  extractErrorContext,
  createBusinessError,
  LlamaError,
  FileOperationError,
  ModelParamsError,
};