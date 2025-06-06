import bodyParser from "body-parser";
import cors from "cors";
import express, { Application, NextFunction, Request, Response } from "express";
import session from "express-session";
import path from "path";

// Configuration and utilities
import config from "./config";
// DON'T import logger at the top level - we'll import it lazily

// Middleware
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

// Routes
import routes from "./routes";

// Types
import type { CustomRequest } from "./types/interfaces";

// Lazy logger function to avoid circular imports
function getLogger() {
  try {
    return require("./utils/logger").default || require("./utils/logger");
  } catch (error) {
    console.error("Failed to load logger:", error);
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

// Créer l'application Express (nom différent pour éviter le conflit)
const expressApp: Application = express();

// Middleware setup
expressApp.use(bodyParser.json({ limit: "10mb" }));
expressApp.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));

// Static files
expressApp.use(express.static(path.join(__dirname, "..", "public")));

// CORS configuration
expressApp.use(
  cors({
    origin: config.cors.origin(),
    credentials: config.cors.credentials,
  })
);

// Session configuration
expressApp.use(
  session({
    secret: config.auth.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: config.nodeEnv === "production",
      maxAge: config.auth.sessionMaxAge,
      httpOnly: true,
      sameSite: "strict",
    },
  })
);

// Request logging middleware with lazy logger loading
expressApp.use(
  (req: CustomRequest, _res: Response, next: NextFunction): void => {
    try {
      const logger = getLogger();
      if (logger && typeof logger.info === "function") {
        logger.info("Request received", {
          method: req.method,
          url: req.url,
          ip: req.ip || req.connection?.remoteAddress,
          userAgent: req.get("User-Agent"),
          sessionId: req.sessionID,
          timestamp: new Date().toISOString(),
        });
      } else {
        console.log("Request received:", {
          method: req.method,
          url: req.url,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Logger error in middleware:", error);
      console.log("Request received:", {
        method: req.method,
        url: req.url,
        timestamp: new Date().toISOString(),
      });
    }
    next();
  }
);

// Routes
expressApp.use("/api", routes);

// Serve index.html for root path
expressApp.get("/", (_req: Request, res: Response): void => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

// Fallback pour SPA routing
expressApp.get("*", (req: Request, res: Response): void => {
  if (req.path.startsWith("/api")) {
    return notFoundHandler(req, res);
  }
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

// 404 handler pour les routes API
expressApp.use("/api/*", notFoundHandler);

// Global error handler
expressApp.use(errorHandler);

// Graceful shutdown
process.on("SIGTERM", () => {
  try {
    const logger = getLogger();
    logger.info("SIGTERM received, shutting down gracefully");
  } catch {
    console.log("SIGTERM received, shutting down gracefully");
  }
  process.exit(0);
});

process.on("SIGINT", () => {
  try {
    const logger = getLogger();
    logger.info("SIGINT received, shutting down gracefully");
  } catch {
    console.log("SIGINT received, shutting down gracefully");
  }
  process.exit(0);
});

// Export via module.d.ts - assigner à l'export par défaut du module
export default expressApp;
