import { PARAM_LIMITS } from "../config/constants";
import { ModelParams, ParamLimitsConfig } from "../types/interfaces";

export function validateModelParams(
  params: Record<string, unknown>
): Partial<ModelParams> {
  const validated: Partial<ModelParams> = {};

  // DEBUG: Log the inputs and limits
  console.log("🔍 Input params:", params);
  console.log("📋 PARAM_LIMITS keys:", Object.keys(PARAM_LIMITS));
  console.log("📋 PARAM_LIMITS:", PARAM_LIMITS);

  for (const [key, value] of Object.entries(params)) {
    console.log(`\n🔍 Processing ${key}: ${value}`);
    console.log(`📋 Key exists in PARAM_LIMITS: ${key in PARAM_LIMITS}`);

    if (key in PARAM_LIMITS) {
      const paramKey = key as keyof ParamLimitsConfig;
      const limit = PARAM_LIMITS[paramKey];
      console.log(`📊 Limit for ${key}:`, limit);

      const numValue =
        paramKey === "seed"
          ? parseInt(String(value), 10)
          : parseFloat(String(value));

      console.log(`🔢 Parsed ${key}: ${numValue} (isNaN: ${isNaN(numValue)})`);

      if (isNaN(numValue)) {
        console.log(`❌ Skipping ${key} - invalid number`);
        continue; // Skip invalid numbers
      }

      const clampedValue = Math.max(limit.min, Math.min(limit.max, numValue));

      console.log(
        `✅ Clamped ${key}: ${clampedValue} (min: ${limit.min}, max: ${limit.max})`
      );
      (validated as any)[paramKey] = clampedValue;
    } else {
      console.log(`❌ Skipping ${key} - not in PARAM_LIMITS`);
    }
  }

  console.log("✅ Final validated params:", validated);
  return validated;
}

/**
 * Generate unique ID based on timestamp
 * @returns Unique ID
 */
export function generateId(): string {
  return Date.now().toString();
}

/**
 * Create timeout promise
 * @param ms - Timeout in milliseconds
 * @returns Promise that rejects after timeout
 */
export function createTimeout(ms: number): Promise<never> {
  return new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("Timeout")), ms);
  });
}

/**
 * Safe JSON parse with fallback
 * @param str - JSON string to parse
 * @param fallback - Fallback value if parsing fails
 * @returns Parsed object or fallback
 */
export function safeJsonParse<T = unknown>(
  str: string,
  fallback: T | null = null
): T | null {
  try {
    return JSON.parse(str) as T;
  } catch (error) {
    return fallback;
  }
}

/**
 * Clean response text using patterns
 * @param text - Text to clean
 * @param patterns - Cleanup patterns
 * @returns Cleaned text
 */
export function cleanResponseText(
  text: string,
  patterns: readonly RegExp[]
): string {
  let cleaned = text;

  patterns.forEach((pattern, index) => {
    if (index === patterns.length - 3) {
      // /(.{10,}?)\1+/g pattern
      cleaned = cleaned.replace(pattern, "$1");
    } else if (index === patterns.length - 2) {
      // /\n{3,}/g pattern
      cleaned = cleaned.replace(pattern, "\n\n");
    } else if (index === patterns.length - 1) {
      // /\s{3,}/g pattern
      cleaned = cleaned.replace(pattern, " ");
    } else {
      cleaned = cleaned.replace(pattern, "");
    }
  });

  return cleaned.trim();
}

/**
 * Type guard to check if a value is a valid number
 * @param value - Value to check
 * @returns True if value is a valid number
 */
export function isValidNumber(value: unknown): value is number {
  return typeof value === "number" && !isNaN(value) && isFinite(value);
}

/**
 * Type guard to check if a string is valid JSON
 * @param str - String to check
 * @returns True if string is valid JSON
 */
export function isValidJson(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Create a promise that resolves after specified milliseconds
 * @param ms - Milliseconds to wait
 * @returns Promise that resolves after timeout
 */
export function delay(ms: number): Promise<void> {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Safely convert unknown value to string
 * @param value - Value to convert
 * @returns String representation of value
 */
export function toString(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}
