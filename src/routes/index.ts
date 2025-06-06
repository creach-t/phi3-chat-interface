import express, { Request, Response, Router } from "express";
import { ApiInfoResponse, HealthResponse } from "../types/api";

const router: Router = express.Router();

// Import routes using ES6 imports with error handling
let authRoutes: Router | null = null;
let chatRoutes: Router | null = null;
let modelParamsRoutes: Router | null = null;
let prepromptsRoutes: Router | null = null;

try {
  authRoutes = require("./authTest").default || require("./authTest"); // Changed to authTest
  console.log("Auth routes loaded successfully");
} catch (e) {
  const message = e instanceof Error ? e.message : String(e);
  console.warn("Auth routes not found or failed to load:", message);
}

try {
  chatRoutes = require("./chat").default || require("./chat");
  console.log("Chat routes loaded successfully");
} catch (e) {
  const message = e instanceof Error ? e.message : String(e);
  console.warn("Chat routes not found or failed to load:", message);
}

try {
  modelParamsRoutes =
    require("./modelParams").default || require("./modelParams");
  console.log("ModelParams routes loaded successfully");
} catch (e) {
  const message = e instanceof Error ? e.message : String(e);
  console.warn("ModelParams routes not found or failed to load:", message);
}

try {
  prepromptsRoutes = require("./preprompts").default || require("./preprompts");
  console.log("Preprompts routes loaded successfully");
} catch (e) {
  const message = e instanceof Error ? e.message : String(e);
  console.warn("Preprompts routes not found or failed to load:", message);
}

// Mount auth routes
if (authRoutes) {
  console.log("Mounting auth routes...");
  console.log("Auth router type:", typeof authRoutes);
  console.log("Auth router has stack:", !!(authRoutes as any).stack);

  // Debug: Check what routes are inside the auth router
  if ((authRoutes as any).stack) {
    console.log("Auth router internal routes:");
    (authRoutes as any).stack.forEach((layer: any, index: number) => {
      if (layer.route) {
        const methods = Object.keys(layer.route.methods)
          .join(", ")
          .toUpperCase();
        console.log(`  ${index + 1}. ${methods} ${layer.route.path}`);
      } else {
        console.log(`  ${index + 1}. Middleware: ${layer.regexp}`);
      }
    });
  }

  try {
    router.use("/", authRoutes);
    console.log("✓ Auth routes mounted successfully");
  } catch (error) {
    console.error("Failed to mount auth routes:", error);
  }
} else {
  console.warn("⚠️ Auth routes not available");
}

// Mount chat routes
if (chatRoutes) {
  try {
    router.use("/chat", chatRoutes);
    console.log("✓ Chat routes mounted");
  } catch (error) {
    console.error("Failed to mount chat routes:", error);
  }
}

// Mount preprompts routes
if (prepromptsRoutes) {
  try {
    router.use("/preprompts", prepromptsRoutes);
    console.log("✓ Preprompts routes mounted");
  } catch (error) {
    console.error("Failed to mount preprompts routes:", error);
  }
}

// Mount model params routes
if (modelParamsRoutes) {
  try {
    router.use("/model-params", modelParamsRoutes);
    console.log("✓ Model params routes mounted");
  } catch (error) {
    console.error("Failed to mount model params routes:", error);
  }
}

// Health check endpoint
router.get("/health", (_req: Request, res: Response): void => {
  const healthResponse: HealthResponse = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || "1.0.0",
  };

  res.json(healthResponse);
});

// API info endpoint
router.get("/", (_req: Request, res: Response): void => {
  const apiInfo: ApiInfoResponse = {
    name: "Phi-3 Chat Server API",
    version: "1.0.0",
    description: "API for Phi-3 model chat interface",
    endpoints: {
      auth: {
        login: "POST /api/login",
        logout: "POST /api/logout",
        checkAuth: "GET /api/check-auth",
      },
      chat: {
        send: "POST /api/chat",
        status: "GET /api/chat/status",
        test: "POST /api/chat/test-connection",
      },
      preprompts: {
        getAll: "GET /api/preprompts",
        getById: "GET /api/preprompts/:id",
        create: "POST /api/preprompts",
        update: "PUT /api/preprompts/:id",
        delete: "DELETE /api/preprompts/:id",
      },
      modelParams: {
        get: "GET /api/model-params",
        getLimits: "GET /api/model-params/limits",
        update: "POST /api/model-params",
        reset: "POST /api/model-params/reset",
        validate: "POST /api/model-params/validate",
      },
      health: "GET /api/health",
    },
  };

  res.json(apiInfo);
});

// Debug: List all registered routes
console.log("=== Route Registration Summary ===");
router.stack.forEach((layer: any, index: number) => {
  if (layer.route) {
    const methods = Object.keys(layer.route.methods).join(", ").toUpperCase();
    console.log(`${index + 1}. ${methods} ${layer.route.path}`);
  } else if (layer.regexp) {
    console.log(`${index + 1}. Middleware: ${layer.regexp}`);
  }
});

export default router;
