import { ModelParams, ParamLimitsConfig } from "../types/interfaces";

// Default model parameters
export const DEFAULT_MODEL_PARAMS: ModelParams = {
  temperature: 0.7,
  maxTokens: 512,
  topP: 0.95,
  contextSize: 2048,
  repeatPenalty: 1.1,
  seed: -1, // -1 pour aléatoire
} as const;

// Parameter validation ranges
export const PARAM_LIMITS: ParamLimitsConfig = {
  temperature: { min: 0.1, max: 2.0 },
  maxTokens: { min: 1, max: 4096 },
  topP: { min: 0.1, max: 1.0 },
  contextSize: { min: 256, max: 8192 },
  repeatPenalty: { min: 0.8, max: 1.5 },
  seed: { min: -1, max: Number.MAX_SAFE_INTEGER },
} as const;

// Response processing patterns
export const CLEANUP_PATTERNS: readonly RegExp[] = [
  /<\|assistant\|>/g,
  /<\|user\|>/g,
  /<\|system\|>/g,
  /<\|end\|>/g,
  /<\|endoftext\|>/g,
  /\n\n?>\s*$/s,
  />\s*$/s,
  /\nUser:\s*$/s,
  /\nAssistant:\s*$/s,
  /(.{10,}?)\1+/g,
  /\n{3,}/g,
  /\s{3,}/g,
] as const;

// Stop sequences for llama response
export const STOP_SEQUENCES: readonly string[] = [
  ">",
  "User:",
  "Assistant:",
] as const;

// Export par défaut pour compatibilité avec module.exports
export default {
  DEFAULT_MODEL_PARAMS,
  PARAM_LIMITS,
  CLEANUP_PATTERNS,
  STOP_SEQUENCES,
};
