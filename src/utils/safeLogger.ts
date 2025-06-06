// utils/safeLogger.ts
// Safe logger wrapper to avoid circular import issues

let _logger: any = null;

function getLogger() {
  if (!_logger) {
    try {
      _logger = require("./logger").default || require("./logger");
    } catch (error) {
      console.error("Failed to load logger:", error);
      _logger = {
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
  return _logger;
}

export const safeLogger = {
  info: (message: string, meta?: any) => {
    try {
      const logger = getLogger();
      if (logger && typeof logger.info === "function") {
        logger.info(message, meta);
      } else {
        console.log(`[INFO] ${message}`, meta ? JSON.stringify(meta) : "");
      }
    } catch (error) {
      console.log(`[INFO] ${message}`, meta ? JSON.stringify(meta) : "");
    }
  },

  error: (message: string, meta?: any) => {
    try {
      const logger = getLogger();
      if (logger && typeof logger.error === "function") {
        logger.error(message, meta);
      } else {
        console.error(`[ERROR] ${message}`, meta ? JSON.stringify(meta) : "");
      }
    } catch (error) {
      console.error(`[ERROR] ${message}`, meta ? JSON.stringify(meta) : "");
    }
  },

  warn: (message: string, meta?: any) => {
    try {
      const logger = getLogger();
      if (logger && typeof logger.warn === "function") {
        logger.warn(message, meta);
      } else {
        console.warn(`[WARN] ${message}`, meta ? JSON.stringify(meta) : "");
      }
    } catch (error) {
      console.warn(`[WARN] ${message}`, meta ? JSON.stringify(meta) : "");
    }
  },

  debug: (message: string, meta?: any) => {
    try {
      const logger = getLogger();
      if (logger && typeof logger.debug === "function") {
        logger.debug(message, meta);
      } else {
        console.debug(`[DEBUG] ${message}`, meta ? JSON.stringify(meta) : "");
      }
    } catch (error) {
      console.debug(`[DEBUG] ${message}`, meta ? JSON.stringify(meta) : "");
    }
  },
};

export default safeLogger;
