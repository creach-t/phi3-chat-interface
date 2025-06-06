// Types pour les réponses d'API standardisées
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Types pour le health check
export interface HealthResponse {
  status: "healthy" | "unhealthy" | "degraded";
  timestamp: string;
  uptime: number;
  version: string;
  services?: {
    [serviceName: string]: {
      status: "up" | "down" | "degraded";
      responseTime?: number;
      lastCheck?: string;
    };
  };
}

// Types pour l'authentification
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse extends ApiResponse {
  data: {
    authenticated: boolean;
    sessionId?: string;
    expiresAt?: string;
  };
}

export interface AuthCheckResponse extends ApiResponse {
  data: {
    authenticated: boolean;
    user?: {
      username: string;
      sessionExpiry?: string;
    };
  };
}

// Types pour le chat
export interface ChatRequest {
  message: string;
  prepromptId?: string;
  modelParams?: Partial<import("./interfaces").ModelParams>;
}

export interface ChatResponse extends ApiResponse {
  data: {
    response: string;
    messageId: string;
    processingTime: number;
    modelParams: import("./interfaces").ModelParams;
  };
}

export interface ChatStatusResponse extends ApiResponse {
  data: {
    isProcessing: boolean;
    currentMessage?: {
      id: string;
      startTime: string;
      estimatedCompletion?: string;
    };
    queue: {
      length: number;
      estimatedWaitTime?: number;
    };
  };
}

// Types pour les paramètres de modèle
export interface ModelParamsResponse extends ApiResponse {
  data: import("./interfaces").ModelParams;
}

export interface ModelParamsLimitsResponse extends ApiResponse {
  data: import("./interfaces").ParamLimitsConfig;
}

export interface ModelParamsValidationResponse extends ApiResponse {
  data: {
    isValid: boolean;
    validatedParams: import("./interfaces").ModelParams;
    errors: string[];
  };
}

// Types pour les preprompts
export interface PrepromptResponse extends ApiResponse {
  data: import("./interfaces").Preprompt;
}

export interface PrepromptsListResponse extends ApiResponse {
  data: import("./interfaces").Preprompt[];
}

// Types pour les endpoints d'information
export interface EndpointInfo {
  [key: string]: string;
}

export interface ApiInfoResponse {
  name: string;
  version: string;
  description: string;
  endpoints: {
    auth: EndpointInfo;
    chat: EndpointInfo;
    preprompts: EndpointInfo;
    modelParams: EndpointInfo;
    models: EndpointInfo; // Ajout des endpoints de modèles
    health: string;
  };
}

// Types pour la validation des requêtes
export interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    value?: unknown;
  }>;
}

// Types d'erreurs API standard
export interface ApiErrorResponse {
  success: false;
  error: string;
  code: string;
  timestamp: string;
  details?: {
    message: string;
    stack?: string;
    validation?: ValidationResult;
  };
}

// Helpers pour créer des réponses standardisées
export function createSuccessResponse<T>(
  data: T,
  message?: string
): ApiResponse<T> {
  const response: ApiResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };

  if (message !== undefined) {
    response.message = message;
  }

  return response;
}

export function createErrorResponse(
  error: string,
  code?: string
): ApiErrorResponse {
  return {
    success: false,
    error,
    code: code || "UNKNOWN_ERROR",
    timestamp: new Date().toISOString(),
  };
}

export function createPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): PaginatedResponse<T> {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// Type guards pour la validation
export function isValidChatRequest(body: any): body is ChatRequest {
  return (
    typeof body === "object" &&
    typeof body.message === "string" &&
    body.message.trim().length > 0
  );
}

export function isValidLoginRequest(body: any): body is LoginRequest {
  return (
    typeof body === "object" &&
    typeof body.username === "string" &&
    typeof body.password === "string" &&
    body.username.trim().length > 0 &&
    body.password.trim().length > 0
  );
}

// Export default avec tous les helpers
export default {
  createSuccessResponse,
  createErrorResponse,
  createPaginatedResponse,
  isValidChatRequest,
  isValidLoginRequest,
};
