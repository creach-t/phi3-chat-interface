import { NextFunction, Request, Response } from "express";
import config from "../config";
import {
  createError,
  createUnauthorizedError,
} from "../middleware/errorHandler";
import { createSuccessResponse } from "../types/api";
import { createController, isLoginRequest } from "../types/controllers";
import {
  AuthCheckResponse,
  LoginResponse,
  LogoutResponse,
  RefreshSessionResponse,
  SessionInfoResponse,
  hasValidSession,
  sessionUtils,
} from "../types/session";
import logger from "../utils/logger";

/**
 * Handle user login
 */
export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Validation de la requête
    if (!isLoginRequest(req)) {
      throw createUnauthorizedError("Username et password requis");
    }

    const { username, password } = req.body;

    logger.info("Login attempt", {
      username,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    });

    // Simple credential check (in production, use proper password hashing)
    if (
      username === config.auth.username &&
      password === config.auth.password
    ) {
      const loginTime = new Date().toISOString();
      const expiresAt = new Date(
        Date.now() + config.auth.sessionMaxAge
      ).toISOString();

      // Ensure session exists before accessing it
      if (!req.session) {
        throw createError(
          "Session initialization failed",
          500,
          "SESSION_ERROR"
        );
      }

      // Mise à jour de la session avec les nouveaux types
      req.session.authenticated = true;
      req.session.user = { username, loginTime };
      req.session.expiresAt = expiresAt;

      logger.info("Successful login", {
        username,
        ip: req.ip,
        sessionId: req.sessionID,
        expiresAt,
      });

      const response: LoginResponse = {
        success: true,
        message: "Connexion réussie",
        loginTime,
      };

      res.json(response);
    } else {
      logger.warn("Failed login attempt", {
        username,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      });

      throw createUnauthorizedError("Identifiants incorrects");
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Handle user logout
 */
export async function logout(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const sessionId = req.sessionID;
    const username = req.session?.user?.username;

    // Check if session exists
    if (!req.session) {
      throw createError("No session to destroy", 400, "NO_SESSION");
    }

    // Promisifier la destruction de session
    await new Promise<void>((resolve, reject) => {
      req.session!.destroy((err: any) => {
        if (err) {
          logger.error("Session destruction error:", {
            error: err.message,
            sessionId,
            username,
          });
          reject(
            createError("Erreur lors de la déconnexion", 500, "LOGOUT_ERROR")
          );
        } else {
          resolve();
        }
      });
    });

    logger.info("User logged out", {
      sessionId,
      username,
      ip: req.ip,
    });

    const response: LogoutResponse = {
      success: true,
      message: "Déconnexion réussie",
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * Check authentication status
 */
export async function checkAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const sessionValid = hasValidSession(req as any);

    if (!sessionValid && req.session?.authenticated) {
      logger.info("Session expired during auth check", {
        sessionId: req.sessionID,
        expiresAt: req.session.expiresAt,
        now: new Date().toISOString(),
      });

      // Nettoyer la session expirée
      req.session.destroy((err: any) => {
        if (err) {
          logger.error("Error destroying expired session:", err);
        }
      });
    }

    const response: AuthCheckResponse = {
      authenticated: sessionValid,
      loginTime: sessionValid ? req.session?.user?.loginTime || null : null,
      sessionId: req.sessionID,
      expiresAt: sessionValid ? req.session?.expiresAt || "" : "",
    };

    logger.debug("Auth check completed", {
      authenticated: sessionValid,
      sessionId: req.sessionID,
      ip: req.ip,
    });

    res.json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * Refresh session (extend expiration)
 */
export async function refreshSession(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.session?.authenticated) {
      throw createUnauthorizedError("Session non authentifiée");
    }

    const oldExpiresAt = req.session.expiresAt;
    const newExpiresAt = new Date(
      Date.now() + config.auth.sessionMaxAge
    ).toISOString();
    const timeExtended = config.auth.sessionMaxAge;

    req.session.expiresAt = newExpiresAt;

    logger.info("Session refreshed", {
      sessionId: req.sessionID,
      username: req.session.user?.username,
      oldExpiresAt,
      newExpiresAt,
      timeExtended,
      ip: req.ip,
    });

    const response: RefreshSessionResponse = {
      expiresAt: newExpiresAt,
      sessionId: req.sessionID,
      timeExtended,
    };

    res.json(createSuccessResponse(response, "Session renouvelée avec succès"));
  } catch (error) {
    next(error);
  }
}

/**
 * Get session info
 */
export async function getSessionInfo(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (
      !req.session?.authenticated ||
      !req.session.user ||
      !req.session.expiresAt
    ) {
      throw createUnauthorizedError("Session non authentifiée");
    }

    const timeRemaining = sessionUtils.getTimeRemaining(req.session.expiresAt);

    const sessionInfo: SessionInfoResponse = {
      sessionId: req.sessionID,
      username: req.session.user.username,
      loginTime: req.session.user.loginTime,
      expiresAt: req.session.expiresAt,
      isValid: sessionUtils.isSessionValid(req.session),
      timeRemaining,
    };

    const response = createSuccessResponse(
      sessionInfo,
      "Informations de session récupérées"
    );
    res.json(response);
  } catch (error) {
    next(error);
  }
}

// Export du contrôleur avec types
export default createController({
  login,
  logout,
  checkAuth,
  refreshSession,
  getSessionInfo,
});
