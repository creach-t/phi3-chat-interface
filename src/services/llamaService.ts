import { ChildProcess, spawn } from "child_process";
import config from "../config";
import type { ModelParams } from "../types/interfaces";
import { safeLogger } from "../utils/safeLogger"; // Use safe logger instead
import responseProcessor from "./responseProcessor";

export interface LlamaResponseData {
  response: string;
  modelParams: ModelParams;
  metadata: {
    chunkCount: number;
    originalLength: number;
    processingTime?: number;
  };
}

export interface LlamaErrorData {
  error: string;
  details: {
    originalResponse?: string;
    errorOutput?: string;
    chunkCount?: number;
    timeout?: number;
    responseLength?: number;
    partialResponse?: string;
  };
}

class LlamaService {
  private readonly llamaCppPath: string;
  private readonly modelPath: string;
  private processAndSend?: () => void;

  constructor() {
    this.llamaCppPath = config.llama.cppPath;
    this.modelPath = config.llama.modelPath;
  }

  /**
   * Build arguments for llama.cpp execution
   */
  buildArgs(prompt: string, params: ModelParams): string[] {
    const args: string[] = [
      "-m",
      this.modelPath,
      "-p",
      prompt,
      "-c",
      params.contextSize.toString(),
      "-n",
      params.maxTokens.toString(),
      "--temp",
      params.temperature.toString(),
      "--top-p",
      params.topP.toString(),
      "--repeat-penalty",
      params.repeatPenalty.toString(),
      "--no-display-prompt",
    ];

    // Add seed if different from -1
    if (params.seed !== -1) {
      args.push("--seed", params.seed.toString());
    }

    return args;
  }

  /**
   * Build full prompt with preprompt
   */
  buildPrompt(message: string, preprompt: string = ""): string {
    if (preprompt.trim()) {
      return `${preprompt.trim()}\n\nUser: ${message}\nAssistant:`;
    }
    return `User: ${message}\nAssistant:`;
  }

  /**
   * Calculate timeout based on model parameters
   */
  calculateTimeout(params: ModelParams): number {
    return Math.max(30000, params.maxTokens * 100);
  }

  /**
   * Create response data object
   */
  private createResponseData(
    processedResponse: string,
    modelParams: ModelParams,
    metadata: {
      chunkCount: number;
      originalLength: number;
      processingTime?: number;
    }
  ): LlamaResponseData {
    return {
      response: processedResponse,
      modelParams,
      metadata,
    };
  }

  /**
   * Create error response object
   */
  private createErrorResponse(
    error: string,
    details: {
      originalResponse?: string;
      errorOutput?: string;
      chunkCount?: number;
      timeout?: number;
      responseLength?: number;
      partialResponse?: string;
    }
  ): LlamaErrorData {
    return {
      error,
      details,
    };
  }

  /**
   * Generate response using llama.cpp
   */
  async generateResponse(
    message: string,
    preprompt: string = "",
    modelParams: ModelParams
  ): Promise<LlamaResponseData> {
    return new Promise<LlamaResponseData>((resolve, reject) => {
      const fullPrompt = this.buildPrompt(message, preprompt);
      const args = this.buildArgs(fullPrompt, modelParams);
      const timeout = this.calculateTimeout(modelParams);
      const startTime = Date.now();

      safeLogger.info("Starting llama.cpp generation", {
        promptLength: fullPrompt.length,
        modelParams,
        timeout,
      });

      const llamaProcess: ChildProcess = spawn(this.llamaCppPath, args);

      let response = "";
      let errorOutput = "";
      let chunkCount = 0;
      let responseSent = false;

      const sendResponse = (data: LlamaResponseData): void => {
        if (!responseSent) {
          responseSent = true;
          resolve(data);
        }
      };

      const sendError = (error: Error): void => {
        if (!responseSent) {
          responseSent = true;
          reject(error);
        }
      };

      // Process and send response
      const processAndSend = (): void => {
        if (responseSent) return;

        const processedResponse = responseProcessor.processResponse(response);

        if (responseProcessor.isValidResponse(processedResponse)) {
          const processingTime = Date.now() - startTime;
          const responseData: LlamaResponseData = this.createResponseData(
            processedResponse,
            modelParams,
            {
              chunkCount,
              originalLength: response.length,
              processingTime,
            }
          );
          sendResponse(responseData);
        } else {
          const errorData: LlamaErrorData = this.createErrorResponse(
            "Empty response after processing",
            {
              originalResponse: response.substring(0, 200),
              errorOutput: errorOutput.substring(0, 200),
              chunkCount,
            }
          );
          sendError(new Error(JSON.stringify(errorData)));
        }
      };

      // Handle stdout data
      llamaProcess.stdout?.on("data", (data: Buffer) => {
        const chunk = data.toString();
        response += chunk;
        chunkCount++;

        safeLogger.debug(`Received chunk ${chunkCount}`, {
          length: chunk.length,
          preview: chunk.substring(0, 50),
        });

        // Check for stop sequences
        if (responseProcessor.containsStopSequence(chunk)) {
          safeLogger.info("Stop sequence detected, terminating process");
          llamaProcess.kill("SIGTERM");
          processAndSend();
        }
      });

      // Handle stderr data
      llamaProcess.stderr?.on("data", (data: Buffer) => {
        const chunk = data.toString();
        errorOutput += chunk;
        safeLogger.warn("llama.cpp stderr:", chunk.substring(0, 100));
      });

      // Handle process close
      llamaProcess.on("close", (code: number | null) => {
        safeLogger.info("llama.cpp process closed", { code, chunkCount });
        if (!responseSent) {
          processAndSend();
        }
      });

      // Handle process error
      llamaProcess.on("error", (error: Error) => {
        safeLogger.error("llama.cpp process error:", error);
        sendError(error);
      });

      // Set timeout
      const timeoutId = setTimeout(() => {
        if (!responseSent) {
          safeLogger.warn("llama.cpp timeout reached");
          llamaProcess.kill("SIGKILL");
          const errorData: LlamaErrorData = this.createErrorResponse(
            "Response timeout",
            {
              timeout,
              responseLength: response.length,
              chunkCount,
              partialResponse: response.substring(0, 100),
            }
          );
          sendError(new Error(JSON.stringify(errorData)));
        }
      }, timeout);

      // Store reference for cleanup
      this.processAndSend = processAndSend;

      // Cleanup timeout on process completion
      llamaProcess.on("close", () => {
        clearTimeout(timeoutId);
      });
    });
  }

  /**
   * Stop current generation process
   */
  stopGeneration(): boolean {
    if (this.processAndSend) {
      this.processAndSend();
      return true;
    }
    return false;
  }

  /**
   * Check if llama.cpp is available
   */
  async testConnection(): Promise<boolean> {
    return new Promise((resolve) => {
      const testProcess = spawn(this.llamaCppPath, ["--help"]);

      testProcess.on("close", (code) => {
        resolve(code === 0);
      });

      testProcess.on("error", () => {
        resolve(false);
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        testProcess.kill();
        resolve(false);
      }, 5000);
    });
  }
}

export default new LlamaService();
