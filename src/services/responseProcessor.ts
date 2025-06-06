import { CLEANUP_PATTERNS, STOP_SEQUENCES } from "../config/constants";
import type { ModelParams } from "../types/interfaces";
import { cleanResponseText } from "../utils/helpers";
import logger from "../utils/logger";

interface ResponseData {
  response: string;
  modelParams: ModelParams;
  timestamp: string;
  [key: string]: unknown; // Pour les métadonnées additionnelles
}

interface ErrorResponse {
  error: string;
  timestamp: string;
  debug: Record<string, unknown>;
}

interface ResponseMetadata {
  chunkCount?: number;
  originalLength?: number;
  processingTime?: number;
  [key: string]: unknown;
}

interface DebugInfo {
  originalResponse?: string;
  errorOutput?: string;
  chunkCount?: number;
  timeout?: number;
  responseLength?: number;
  partialResponse?: string;
  [key: string]: unknown;
}

class ResponseProcessor {
  private readonly cleanupPatterns: readonly RegExp[];
  private readonly stopSequences: readonly string[];

  constructor() {
    this.cleanupPatterns = CLEANUP_PATTERNS;
    this.stopSequences = STOP_SEQUENCES;
  }

  /**
   * Check if chunk contains stop sequence
   */
  containsStopSequence(chunk: string): boolean {
    if (!chunk || typeof chunk !== "string") {
      return false;
    }

    return this.stopSequences.some((seq: string) => chunk.includes(seq));
  }

  /**
   * Process and clean response text
   */
  processResponse(rawResponse: string): string {
    if (!rawResponse || typeof rawResponse !== "string") {
      logger.warn("Invalid raw response provided to processResponse", {
        type: typeof rawResponse,
        value: rawResponse,
      });
      return "";
    }

    // Clean the response using defined patterns
    const cleaned = cleanResponseText(rawResponse, this.cleanupPatterns);

    // logger.debug("Response processing:", {
    //   originalLength: rawResponse.length,
    //   cleanedLength: cleaned.length,
    //   preview: cleaned.substring(0, 100),
    //   patternsApplied: this.cleanupPatterns.length,
    // });

    return cleaned;
  }

  /**
   * Validate processed response
   */
  isValidResponse(response: string): boolean {
    if (!response || typeof response !== "string") {
      return false;
    }

    const trimmed = response.trim();
    const isValid = trimmed.length > 0;

    if (!isValid) {
      logger.debug("Response validation failed", {
        originalLength: response.length,
        trimmedLength: trimmed.length,
      });
    }

    return isValid;
  }

  /**
   * Create response data object
   */
  createResponseData(
    response: string,
    modelParams: ModelParams,
    metadata: ResponseMetadata = {}
  ): ResponseData {
    const responseData: ResponseData = {
      response,
      modelParams,
      timestamp: new Date().toISOString(),
      ...metadata,
    };

    logger.debug("Created response data", {
      responseLength: response.length,
      modelParams: {
        temperature: modelParams.temperature,
        maxTokens: modelParams.maxTokens,
        contextSize: modelParams.contextSize,
      },
      metadataKeys: Object.keys(metadata),
    });

    return responseData;
  }

  /**
   * Create error response object
   */
  createErrorResponse(message: string, debug: DebugInfo = {}): ErrorResponse {
    const errorResponse: ErrorResponse = {
      error: message,
      timestamp: new Date().toISOString(),
      debug,
    };

    logger.error("Created error response", {
      message,
      debugKeys: Object.keys(debug),
    });

    return errorResponse;
  }

  /**
   * Get cleanup patterns for inspection
   */
  getCleanupPatterns(): readonly RegExp[] {
    return this.cleanupPatterns;
  }

  /**
   * Get stop sequences for inspection
   */
  getStopSequences(): readonly string[] {
    return this.stopSequences;
  }

  /**
   * Check if response exceeds length limits
   */
  validateResponseLength(response: string, maxLength: number = 50000): boolean {
    if (!response || typeof response !== "string") {
      return false;
    }

    const isValid = response.length <= maxLength;

    if (!isValid) {
      logger.warn("Response exceeds maximum length", {
        actualLength: response.length,
        maxLength,
        preview: response.substring(0, 100),
      });
    }

    return isValid;
  }

  /**
   * Extract quality metrics from response
   */
  getResponseMetrics(response: string): {
    length: number;
    wordCount: number;
    lineCount: number;
    hasValidStructure: boolean;
  } {
    if (!response || typeof response !== "string") {
      return {
        length: 0,
        wordCount: 0,
        lineCount: 0,
        hasValidStructure: false,
      };
    }

    const words = response
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0);
    const lines = response.split("\n");
    const hasValidStructure = response.length > 10 && words.length > 2;

    return {
      length: response.length,
      wordCount: words.length,
      lineCount: lines.length,
      hasValidStructure,
    };
  }
}

export default new ResponseProcessor();
