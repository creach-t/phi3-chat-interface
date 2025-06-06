import "dotenv/config";
import { AppConfig } from "../types/interfaces";

const appConfig: AppConfig = {
  // Server
  port: parseInt(process.env.PORT || "3000", 10),
  ipAddress: process.env.IP_ADDRESS || "localhost",
  nodeEnv:
    (process.env.NODE_ENV as "development" | "production" | "test") ||
    "development",

  // Authentication
  auth: {
    username: process.env.ADMIN_USERNAME || "admin",
    password: process.env.ADMIN_PASSWORD || "password123",
    sessionSecret: process.env.SESSION_SECRET || "phi3-secret-key-change-this",
    sessionMaxAge: 24 * 60 * 60 * 1000, // 24h
  },

  // Llama.cpp
  llama: {
    cppPath: process.env.LLAMA_CPP_PATH || "./llama.cpp/build/bin/llama-cli",
    modelPath:
      process.env.MODEL_PATH ||
      "./llama.cpp/models/Phi-3-mini-4k-instruct-Q2_K.gguf",
  },

  // Data storage
  data: {
    dir: process.env.DATA_DIR || "./data",
    prepromptsFile: "preprompts.json",
    modelParamsFile: "model-params.json",
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || "info",
    file: process.env.LOG_FILE || "./logs/app.log",
  },

  // CORS
  cors: {
    origin: (): string => {
      return `http://${process.env.IP_ADDRESS || "localhost"}:${
        process.env.PORT || 3000
      }`;
    },
    credentials: true,
  },
};

module.exports = appConfig;