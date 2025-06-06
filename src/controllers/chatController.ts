import { Request, Response } from "express";
import fileService from "../services/fileService";
import llamaService from "../services/llamaService";
import { safeLogger } from "../utils/safeLogger"; // Use safe logger instead

/**
 * Handle chat message and generate response
 */
export async function sendMessage(req: Request, res: Response): Promise<void> {
  try {
    const { message, preprompt = "", modelParams } = req.body;

    safeLogger.info("Chat request received", {
      messageLength: message.length,
      prepromptLength: preprompt.length,
      hasCustomParams: !!modelParams,
      ip: req.ip,
    });

    // Load model parameters (use provided or saved)
    const currentParams = modelParams || fileService.loadModelParams();

    safeLogger.debug("Using model parameters", currentParams);

    // Generate response using llama service
    const responseData = await llamaService.generateResponse(
      message,
      preprompt,
      currentParams
    );

    safeLogger.info("Chat response generated", {
      responseLength: responseData.response.length,
      processingMetadata: (responseData as any).chunkCount || 0,
    });

    res.json(responseData);
  } catch (error: any) {
    safeLogger.error("Chat error:", error);

    // Handle timeout errors
    if (error.message.includes("Timeout")) {
      try {
        const errorData = JSON.parse(error.message);
        res.status(408).json(errorData);
        return;
      } catch (parseError) {
        res.status(408).json({
          error: "Timeout de la génération de réponse",
          code: "GENERATION_TIMEOUT",
        });
        return;
      }
    }

    // Handle other llama service errors
    if (error.message.includes("Empty response")) {
      try {
        const errorData = JSON.parse(error.message);
        res.status(500).json(errorData);
        return;
      } catch (parseError) {
        res.status(500).json({
          error: "Réponse vide générée",
          code: "EMPTY_RESPONSE",
        });
        return;
      }
    }

    // Handle process spawn errors
    if (error.code === "ENOENT") {
      res.status(500).json({
        error: "Llama.cpp non trouvé. Vérifiez le chemin de configuration.",
        code: "LLAMA_NOT_FOUND",
        details: "Le binaire llama-cli est introuvable au chemin spécifié",
      });
      return;
    }

    // Generic error response
    res.status(500).json({
      error: "Erreur lors de la génération de réponse",
      code: "GENERATION_ERROR",
      message: error.message,
    });
  }
}

/**
 * Get chat statistics and status
 */
export async function getStatus(_req: Request, res: Response): Promise<void> {
  try {
    const currentParams = fileService.loadModelParams();
    const preprompts = fileService.loadPreprompts();

    res.json({
      status: "ready",
      modelParams: currentParams,
      prepromptsCount: preprompts.length,
      serverTime: new Date().toISOString(),
      uptime: process.uptime(),
    });
  } catch (error) {
    safeLogger.error("Error getting chat status:", error);
    res.status(500).json({
      error: "Erreur lors de la récupération du statut",
      code: "STATUS_ERROR",
    });
  }
}

/**
 * Test llama.cpp connectivity
 */
export async function testConnection(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const testMessage = "Hello";
    const testParams = {
      temperature: 0.7,
      maxTokens: 10,
      topP: 0.95,
      contextSize: 256,
      repeatPenalty: 1.1,
      seed: -1,
    };

    safeLogger.info("Testing llama.cpp connection");

    const responseData = await llamaService.generateResponse(
      testMessage,
      "",
      testParams
    );

    res.json({
      status: "connected",
      testResponse: responseData.response.substring(0, 100),
      message: "Connexion à llama.cpp réussie",
    });
  } catch (error: any) {
    safeLogger.error("Connection test failed:", error);

    res.status(500).json({
      status: "disconnected",
      error: "Échec de la connexion à llama.cpp",
      code: "CONNECTION_TEST_FAILED",
      details: error.message,
    });
  }
}
