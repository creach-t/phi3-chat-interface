// Configuration types
export interface AuthConfig {
  username: string;
  password: string;
  sessionSecret: string;
  sessionMaxAge: number;
}

export interface LlamaConfig {
  cppPath: string;
  modelPath: string;
}

export interface DataConfig {
  dir: string;
  prepromptsFile: string;
  modelParamsFile: string;
}

export interface LoggingConfig {
  level: string;
  file: string;
}

export interface CorsConfig {
  origin: () => string;
  credentials: boolean;
}

export interface AppConfig {
  port: number;
  ipAddress: string;
  nodeEnv: "development" | "production" | "test";
  auth: AuthConfig;
  llama: LlamaConfig;
  data: DataConfig;
  logging: LoggingConfig;
  cors: CorsConfig;
}

// Logger types (Winston compatible)
export interface LogMetadata {
  [key: string]: unknown;
}

export interface Logger {
  info(message: string, meta?: LogMetadata): Logger;
  error(message: string, meta?: LogMetadata | Error): Logger;
  warn(message: string, meta?: LogMetadata): Logger;
  debug(message: string, meta?: LogMetadata): Logger;
  log(level: string, message: string, meta?: LogMetadata): Logger;
  add(transport: unknown): Logger;
}

// Model parameters types
export interface ModelParams {
  temperature: number;
  maxTokens: number;
  topP: number;
  contextSize: number;
  repeatPenalty: number;
  seed: number;
}

export interface ParamLimits {
  min: number;
  max: number;
}

export interface ParamLimitsConfig {
  temperature: ParamLimits;
  maxTokens: ParamLimits;
  topP: ParamLimits;
  contextSize: ParamLimits;
  repeatPenalty: ParamLimits;
  seed: ParamLimits;
}

// File service types
export interface Preprompt {
  id: string;
  name: string;
  content: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FileService {
  ensureDataDir(): void;
  getDataPath(filename: string): string;
  loadJson<T>(filename: string, defaultValue?: T): T;
  saveJson(filename: string, data: unknown): boolean;
  loadPreprompts(): Preprompt[];
  savePreprompts(preprompts: Preprompt[]): boolean;
  loadModelParams(): ModelParams;
  saveModelParams(params: ModelParams | Partial<ModelParams>): boolean;
}

// Express types
import { Application, NextFunction, Request, Response } from "express";

export interface CustomRequest extends Request {
  sessionID: string;
}

// Error types
export interface AppError extends Error {
  status?: number;
  statusCode?: number;
  code?: string;
}

export interface ErrorResponse {
  error: string;
  code: string;
  timestamp: string;
  details?: {
    message: string;
    stack?: string;
  };
}

export interface ErrorHandler {
  (err: AppError, req: Request, res: Response, next: NextFunction): void;
}

export interface NotFoundHandler {
  (req: Request, res: Response): void;
}

export interface AsyncHandler<T = any> {
  (req: Request, res: Response, next: NextFunction): Promise<T>;
}

export interface MiddlewareHandlers {
  errorHandler: ErrorHandler;
  notFoundHandler: NotFoundHandler;
  asyncErrorHandler: <T>(
    fn: AsyncHandler<T>
  ) => (req: Request, res: Response, next: NextFunction) => void;
}

// Express app type - Option 1: Utiliser directement Application (plus simple)
export type ExpressApp = Application;

// Express app type - Option 2: Si tu veux étendre avec des méthodes custom
// export interface ExpressApp extends Application {
//   // Ajoute ici seulement des méthodes personnalisées
//   // listen est déjà parfaitement défini dans Application
// }
