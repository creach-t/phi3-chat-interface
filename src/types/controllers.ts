import { NextFunction, Request, Response } from "express";
import { ModelParams } from "./interfaces";

// Type de base pour tous les contrôleurs
export type ControllerFunction = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void> | void;

// Types spécifiques pour les contrôleurs de paramètres de modèle
export interface ModelParamsController {
  get: ControllerFunction;
  update: ControllerFunction;
  reset: ControllerFunction;
  getLimits: ControllerFunction;
  validate: ControllerFunction;
}

// Types pour les requêtes de paramètres de modèle
export interface ModelParamsUpdateRequest extends Request {
  body: Partial<ModelParams>;
}

export interface ModelParamsValidateRequest extends Request {
  body: Record<string, unknown>;
}

// Types pour les contrôleurs d'authentification
export interface AuthController {
  login: ControllerFunction;
  logout: ControllerFunction;
  checkAuth: ControllerFunction;
  refreshSession: ControllerFunction;
}

// Types pour les requêtes d'authentification
export interface LoginRequest extends Request {
  body: {
    username: string;
    password: string;
  };
}

export interface AuthenticatedRequest extends Request {
  user?: {
    username: string;
    sessionId: string;
    expiresAt: Date;
  };
  isAuthenticated?: boolean;
}

// Types pour les contrôleurs de chat
export interface ChatController {
  send: ControllerFunction;
  getStatus: ControllerFunction;
  testConnection: ControllerFunction;
  stopGeneration: ControllerFunction;
}

// Types pour les requêtes de chat
export interface ChatRequest extends Request {
  body: {
    message: string;
    prepromptId?: string;
    modelParams?: Partial<ModelParams>;
  };
}

// Types pour les contrôleurs de preprompts
export interface PrepromptsController {
  getAll: ControllerFunction;
  getById: ControllerFunction;
  create: ControllerFunction;
  update: ControllerFunction;
  delete: ControllerFunction;
}

// Types pour les requêtes de preprompts
export interface PrepromptCreateRequest extends Request {
  body: {
    name: string;
    content: string;
  };
}

export interface PrepromptUpdateRequest extends Request {
  params: {
    id: string;
  };
  body: {
    name?: string;
    content?: string;
  };
}

export interface PrepromptByIdRequest extends Request {
  params: {
    id: string;
  };
}

// Types pour les middlewares
export type MiddlewareFunction = (
  req: Request,
  res: Response,
  next: NextFunction
) => void | Promise<void>;

export type ValidationSchemas = "modelParams" | "preprompt" | "chat" | "login";

export interface ValidationMiddleware {
  (schema: ValidationSchemas): MiddlewareFunction;
}

export interface AuthMiddleware {
  requireAuth: MiddlewareFunction;
  optionalAuth: MiddlewareFunction;
  checkSession: MiddlewareFunction;
}

// Types pour les erreurs de contrôleur
export interface ControllerError extends Error {
  status?: number;
  code?: string;
  details?: Record<string, unknown>;
}

// Helper pour créer des contrôleurs typés
export function createController<T extends Record<string, ControllerFunction>>(
  controller: T
): T {
  return controller;
}

// Helper pour créer des middlewares typés
export function createMiddleware(
  middleware: MiddlewareFunction
): MiddlewareFunction {
  return middleware;
}

// Type guards pour les requêtes
export function isModelParamsUpdateRequest(
  req: Request
): req is ModelParamsUpdateRequest {
  return typeof req.body === "object" && req.body !== null;
}

export function isLoginRequest(req: Request): req is LoginRequest {
  return (
    typeof req.body === "object" &&
    req.body !== null &&
    typeof req.body.username === "string" &&
    typeof req.body.password === "string"
  );
}

export function isChatRequest(req: Request): req is ChatRequest {
  return (
    typeof req.body === "object" &&
    req.body !== null &&
    typeof req.body.message === "string" &&
    req.body.message.trim().length > 0
  );
}

export function isAuthenticatedRequest(
  req: Request
): req is AuthenticatedRequest {
  return "user" in req && req.user !== undefined;
}

// Export par défaut avec tous les types et helpers
export default {
  createController,
  createMiddleware,
  isModelParamsUpdateRequest,
  isLoginRequest,
  isChatRequest,
  isAuthenticatedRequest,
};
