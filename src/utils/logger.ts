import fs from "fs";
import path from "path";
import winston from "winston";

// Import config with error handling
let config: any;
try {
  config = require("../config").default || require("../config");
} catch (error) {
  console.error("Failed to load config:", error);
  config = null;
}

// Fallback values if config is not available
const defaultLogFile = "./logs/app.log";
const defaultLogLevel = "info";
const defaultNodeEnv = "development";

// Get config values with fallbacks
const logFile = config?.logging?.file || defaultLogFile;
const logLevel = config?.logging?.level || defaultLogLevel;
const nodeEnv = config?.nodeEnv || defaultNodeEnv;

console.log("Logger initialization:", {
  logFile,
  logLevel,
  nodeEnv,
  configAvailable: !!config,
});

// Create logs directory if it doesn't exist
let logDir: string;
try {
  logDir = path.dirname(logFile);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
    console.log("Created log directory:", logDir);
  }
} catch (error) {
  console.error("Failed to create log directory:", error);
  logDir = "./logs"; // fallback
}

// Create logger with error handling
let logger: winston.Logger;

try {
  logger = winston.createLogger({
    level: logLevel,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    defaultMeta: { service: "phi3-chat-server" },
    transports: [
      // Write all logs to file
      new winston.transports.File({ filename: logFile }),
    ],
  });

  // If we're not in production, also log to console
  if (nodeEnv !== "production") {
    logger.add(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        ),
      })
    );
  }

  console.log("Winston logger initialized successfully");
} catch (error) {
  console.error("Failed to initialize Winston logger:", error);

  // Fallback to console logger
  logger = {
    info: (message: string, meta?: any) => {
      console.log(`[INFO] ${message}`, meta || "");
    },
    error: (message: string, meta?: any) => {
      console.error(`[ERROR] ${message}`, meta || "");
    },
    warn: (message: string, meta?: any) => {
      console.warn(`[WARN] ${message}`, meta || "");
    },
    debug: (message: string, meta?: any) => {
      console.debug(`[DEBUG] ${message}`, meta || "");
    },
  } as winston.Logger;

  console.log("Using fallback console logger");
}

// Verify logger is properly initialized
if (!logger || typeof logger.info !== "function") {
  console.error("Logger is not properly initialized!");
  throw new Error("Logger initialization failed");
}
