import { NextFunction, Request, Response } from "express";
import { safeLogger } from "../utils/safeLogger"; // Use safe logger instead

// Extend Express Request interface to include isAuthenticated
declare module "express-serve-static-core" {
  interface Request {
    isAuthenticated?: boolean;
    session?: {
      authenticated?: boolean;
      [key: string]: any;
    };
  }
}

/**
 * Middleware to require authentication
 */
function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (req.session && req.session.authenticated) {
    safeLogger.debug("Authentication successful for request:", req.path);
    next();
  } else {
    safeLogger.warn("Unauthorized access attempt:", {
      path: req.path,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    });
    res.status(401).json({
      error: "Non authentifié",
      code: "UNAUTHORIZED",
    });
  }
}

/**
 * Middleware to check authentication status (non-blocking)
 */
function checkAuth(req: Request, next: NextFunction): void {
  req.isAuthenticated = !!(req.session && req.session.authenticated);
  next();
}

export { checkAuth, requireAuth };
