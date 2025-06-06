import type winston from "winston";
import type { AppConfig, ExpressApp } from "./interfaces";

declare module "src/app" {
  const expressApp: ExpressApp;
  export default app;
}

declare module "src/config" {
  const appConfig: AppConfig;
  export default config;
}

declare module "src/utils/logger" {
  const logger: winston.Logger;
  export default logger;
}

declare module "src/utils/helpers" {
  export function validateModelParams(
    params: Record<string, unknown>
  ): Partial<import("./interfaces").ModelParams>;
  export function generateId(): string;
  export function createTimeout(ms: number): Promise<never>;
  export function safeJsonParse<T = unknown>(
    str: string,
    fallback?: T | null
  ): T | null;
  export function cleanResponseText(
    text: string,
    patterns: readonly RegExp[]
  ): string;
  export function isValidNumber(value: unknown): value is number;
  export function isValidJson(str: string): boolean;
  export function delay(ms: number): Promise<void>;
  export function toString(value: unknown): string;

  const helpers: {
    validateModelParams: typeof validateModelParams;
    generateId: typeof generateId;
    createTimeout: typeof createTimeout;
    safeJsonParse: typeof safeJsonParse;
    cleanResponseText: typeof cleanResponseText;
    isValidNumber: typeof isValidNumber;
    isValidJson: typeof isValidJson;
    delay: typeof delay;
    toString: typeof toString;
  };
  export default helpers;
}

declare module "src/services/fileService" {}

declare module "src/middleware/errorHandler" {}

declare module "src/routes" {}

declare module "config/constants" {
  export const DEFAULT_MODEL_PARAMS: import("./interfaces").ModelParams;
  export const PARAM_LIMITS: import("./interfaces").ParamLimitsConfig;
  export const CLEANUP_PATTERNS: readonly RegExp[];
  export const STOP_SEQUENCES: readonly string[];

  const constants: {
    DEFAULT_MODEL_PARAMS: import("./interfaces").ModelParams;
    PARAM_LIMITS: import("./interfaces").ParamLimitsConfig;
    CLEANUP_PATTERNS: readonly RegExp[];
    STOP_SEQUENCES: readonly string[];
  };
  export default constants;
}
