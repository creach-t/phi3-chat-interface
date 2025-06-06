// Types pour les sessions Express et l'authentification

import { Request } from "express";
import "express-session";

// Étendre les types de session Express
declare module "express-session" {
  interface SessionData {
    authenticated?: boolean;
    user?: {
      username: string;
      loginTime: string;
    };
    expiresAt?: string;
  }
}

// Étendre l'interface Request Express
declare global {
  namespace Express {
    interface Request {
      user?: {
        username: string;
        sessionId: string;
        expiresAt: Date;
      };
      isAuthenticated?: boolean;
    }
  }
}

// Interface pour les données de session personnalisées
export interface CustomSessionData {
  authenticated?: boolean;
  user?: {
    username: string;
    loginTime: string;
  };
  expiresAt?: string;
}

// Types pour les réponses d'authentification
export interface LoginResponse {
  success: true;
  message: string;
  loginTime: string;
}

export interface LogoutResponse {
  success: true;
  message: string;
}

export interface AuthCheckResponse {
  authenticated: boolean;
  loginTime: string | null;
  sessionId: string;
  expiresAt?: string;
}

export interface SessionInfoResponse {
  sessionId: string;
  username: string;
  loginTime: string;
  expiresAt: string;
  isValid: boolean;
  timeRemaining?: number; // en millisecondes
}

export interface RefreshSessionResponse {
  expiresAt: string;
  sessionId: string;
  timeExtended: number; // en millisecondes
}

// Types pour les erreurs d'authentification
export interface AuthError {
  code:
    | "INVALID_CREDENTIALS"
    | "SESSION_EXPIRED"
    | "NO_SESSION"
    | "LOGIN_ERROR"
    | "LOGOUT_ERROR"
    | "AUTH_CHECK_ERROR";
  message: string;
  timestamp: string;
}

// Utilitaires pour les sessions
export interface SessionUtils {
  isSessionValid(session: CustomSessionData): boolean;
  getTimeRemaining(expiresAt: string): number;
  isExpired(expiresAt: string): boolean;
  createSessionData(username: string): CustomSessionData;
}

// Implémentation des utilitaires
export const sessionUtils: SessionUtils = {
  isSessionValid(session: CustomSessionData): boolean {
    if (!session.authenticated || !session.user || !session.expiresAt) {
      return false;
    }

    return !this.isExpired(session.expiresAt);
  },

  getTimeRemaining(expiresAt: string): number {
    const expiry = new Date(expiresAt);
    const now = new Date();
    return Math.max(0, expiry.getTime() - now.getTime());
  },

  isExpired(expiresAt: string): boolean {
    const expiry = new Date(expiresAt);
    const now = new Date();
    return now >= expiry;
  },

  createSessionData(username: string): CustomSessionData {
    const loginTime = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24h par défaut

    return {
      authenticated: true,
      user: {
        username,
        loginTime,
      },
      expiresAt,
    };
  },
};

// Type guards pour les sessions
export function isAuthenticated(req: Request): boolean {
  return !!(req.session?.authenticated && req.user);
}

export function hasValidSession(req: Request): boolean {
  if (!req.session?.authenticated || !req.session.expiresAt) {
    return false;
  }

  return sessionUtils.isSessionValid(req.session as CustomSessionData);
}

// Constants pour les sessions
export const SESSION_CONSTANTS = {
  DEFAULT_MAX_AGE: 24 * 60 * 60 * 1000, // 24 heures en millisecondes
  WARNING_THRESHOLD: 30 * 60 * 1000, // 30 minutes avant expiration
  EXTEND_THRESHOLD: 60 * 60 * 1000, // Étendre si moins d'1h restante
} as const;

// Export par défaut
export default {
  sessionUtils,
  isAuthenticated,
  hasValidSession,
  SESSION_CONSTANTS,
};
