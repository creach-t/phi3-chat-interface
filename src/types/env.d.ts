declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Server
      PORT?: string;
      IP_ADDRESS?: string;
      NODE_ENV?: "development" | "production" | "test";

      // Authentication
      ADMIN_USERNAME?: string;
      ADMIN_PASSWORD?: string;
      SESSION_SECRET?: string;

      // Llama.cpp
      LLAMA_CPP_PATH?: string;
      MODEL_PATH?: string;

      // Data storage
      DATA_DIR?: string;

      // Logging
      LOG_LEVEL?: string;
      LOG_FILE?: string;
    }
  }
}

export {};
