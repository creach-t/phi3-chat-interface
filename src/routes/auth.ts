import express, { Request, Response, Router } from "express";
import { ApiInfoResponse, HealthResponse } from "../types/api";

const router: Router = express.Router();

// Import routes using proper ES6 imports
try {
  // Try to import each route file - you may need to create these if they don't exist
  let authRoutes: any = null;
  let chatRoutes: any = null;
  let modelParamsRoutes: any = null;
  let prepromptsRoutes: any = null;

  try {
    authRoutes = require("./auth");
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.warn("Auth routes not found or failed to load:", message);
  }

  try {
    chatRoutes = require("./chat");
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.warn("Chat routes not found or failed to load:", message);
  }

  try {
    modelParamsRoutes = require("./modelParams");
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.warn("ModelParams routes not found or failed to load:", message);
  }

  try {
    prepromptsRoutes = require("./preprompts");
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.warn("Preprompts routes not found or failed to load:", message);
  }

  // Mount auth routes directly (no additional /api prefix since app.ts already adds it)
  if (authRoutes) {
    const authRouter = authRoutes.default || authRoutes;
    if (
      typeof authRouter === "function" ||
      (authRouter && typeof authRouter.use === "function")
    ) {
      router.use("/", authRouter); // Changed from "/api" to "/"
      console.log("✓ Auth routes mounted");
    } else {
      console.warn("Auth routes: Invalid router export");
    }
  }

  // Mount other API routes (remove /api prefix from all)
  if (chatRoutes) {
    const chatRouter = chatRoutes.default || chatRoutes;
    if (
      typeof chatRouter === "function" ||
      (chatRouter && typeof chatRouter.use === "function")
    ) {
      router.use("/chat", chatRouter); // Changed from "/api/chat" to "/chat"
      console.log("✓ Chat routes mounted");
    } else {
      console.warn("Chat routes: Invalid router export");
    }
  }

  if (prepromptsRoutes) {
    const prepromptsRouter = prepromptsRoutes.default || prepromptsRoutes;
    if (
      typeof prepromptsRouter === "function" ||
      (prepromptsRouter && typeof prepromptsRouter.use === "function")
    ) {
      router.use("/preprompts", prepromptsRouter); // Changed from "/api/preprompts" to "/preprompts"
      console.log("✓ Preprompts routes mounted");
    } else {
      console.warn("Preprompts routes: Invalid router export");
    }
  }

  if (modelParamsRoutes) {
    const modelParamsRouter = modelParamsRoutes.default || modelParamsRoutes;
    if (
      typeof modelParamsRouter === "function" ||
      (modelParamsRouter && typeof modelParamsRouter.use === "function")
    ) {
      router.use("/model-params", modelParamsRouter); // Changed from "/api/model-params" to "/model-params"
      console.log("✓ Model params routes mounted");
    } else {
      console.warn("ModelParams routes: Invalid router export");
    }
  }
} catch (error) {
  console.error("Error loading routes:", error);
}

// Health check endpoint (remove /api prefix)
router.get("/health", (_req: Request, res: Response): void => {
  const healthResponse: HealthResponse = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || "1.0.0",
  };

  res.json(healthResponse);
});

// API info endpoint (remove /api prefix)
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

export default router;
