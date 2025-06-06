import { Server } from "http";
import app from "./src/app";
import config from "./src/config";
import fileService from "./src/services/fileService";

// Create a simple logger with proper fallback
const createLogger = () => {
  try {
    const importedLogger = require("./src/utils/logger").default;
    if (importedLogger && importedLogger.info) {
      return importedLogger;
    }
  } catch (error) {
    console.warn(
      "Logger import failed, using console fallback:",
      typeof error === "object" && error !== null && "message" in error
        ? (error as { message: string }).message
        : error
    );
  }

  // Fallback logger
  return {
    info: (message: string, meta?: any) =>
      console.log(`[INFO] ${message}`, meta || ""),
    error: (message: string, error?: any) =>
      console.error(`[ERROR] ${message}`, error || ""),
    warn: (message: string, meta?: any) =>
      console.warn(`[WARN] ${message}`, meta || ""),
    debug: (message: string, meta?: any) =>
      console.log(`[DEBUG] ${message}`, meta || ""),
  };
};

const logger = createLogger();

// Ensure data directory exists
fileService.ensureDataDir();

// Start server
const server: Server = app.listen(config.port, config.ipAddress, () => {
  logger.info("Server started", {
    host: config.ipAddress,
    port: config.port,
    environment: config.nodeEnv,
    url: `http://${config.ipAddress}:${config.port}`,
  });

  console.log(
    `🚀 Serveur démarré sur http://${config.ipAddress}:${config.port}`
  );
  console.log("📋 Identifiants par défaut:");
  console.log(`   Username: ${config.auth.username}`);
  console.log(`   Password: ${config.auth.password}`);
  console.log(
    "⚙️ Paramètres par défaut chargés:",
    fileService.loadModelParams()
  );

  if (config.nodeEnv === "development") {
    console.log("🔧 Mode développement activé");
    console.log("📝 Logs détaillés disponibles dans:", config.logging.file);
  }
});

// Graceful shutdown
const gracefulShutdown = (signal: string): void => {
  logger.info(`${signal} received, shutting down gracefully`);
  server.close(() => {
    logger.info("Process terminated");
    process.exit(0);
  });
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle uncaught exceptions
process.on("uncaughtException", (error: Error) => {
  logger.error("Uncaught exception:", error);
  process.exit(1);
});

process.on(
  "unhandledRejection",
  (reason: unknown, promise: Promise<unknown>) => {
    logger.error("Unhandled rejection:", { reason, promise });
    process.exit(1);
  }
);

export default server;
