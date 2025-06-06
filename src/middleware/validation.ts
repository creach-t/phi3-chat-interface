import { NextFunction, Request, Response } from "express";
import Joi from "joi";
import { DEFAULT_MODEL_PARAMS, PARAM_LIMITS } from "../config/constants";
import { validateModelParams } from "../utils/helpers";

// Validation schemas
const schemas = {
  // Login validation
  login: Joi.object({
    username: Joi.string().min(1).max(50).required(),
    password: Joi.string().min(1).max(100).required(),
  }),

  // Preprompt validation
  preprompt: Joi.object({
    name: Joi.string().min(1).max(100).required(),
    content: Joi.string().min(1).max(10000).required(),
  }),

  // Model parameters validation
  modelParams: Joi.object({
    temperature: Joi.number()
      .min(PARAM_LIMITS.temperature.min)
      .max(PARAM_LIMITS.temperature.max),
    maxTokens: Joi.number()
      .integer()
      .min(PARAM_LIMITS.maxTokens.min)
      .max(PARAM_LIMITS.maxTokens.max),
    topP: Joi.number().min(PARAM_LIMITS.topP.min).max(PARAM_LIMITS.topP.max),
    contextSize: Joi.number()
      .integer()
      .min(PARAM_LIMITS.contextSize.min)
      .max(PARAM_LIMITS.contextSize.max),
    repeatPenalty: Joi.number()
      .min(PARAM_LIMITS.repeatPenalty.min)
      .max(PARAM_LIMITS.repeatPenalty.max),
    seed: Joi.number()
      .integer()
      .min(PARAM_LIMITS.seed.min)
      .max(PARAM_LIMITS.seed.max),
  }),

  // Chat validation
  chat: Joi.object({
    message: Joi.string().min(1).max(5000).required(),
    preprompt: Joi.string().max(10000).allow(""),
    modelParams: Joi.object().optional(),
  }),
};

type SchemaName = keyof typeof schemas;
type Property = "body" | "query" | "params";

/**
 * Create validation middleware for a specific schema
 * @param schemaName - Name of the schema to use
 * @param property - Request property to validate ('body', 'query', 'params')
 * @returns Validation middleware function
 */
function validate(schemaName: SchemaName, property: Property = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    const schema = schemas[schemaName];
    if (!schema) {
      return next(new Error(`Validation schema '${schemaName}' not found`));
    }

    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const validationError: any = new Error("Validation failed");
      validationError.name = "ValidationError";
      validationError.details = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      }));
      return next(validationError);
    }

    // Replace the request property with the validated value
    (req as any)[property] = value;
    next();
  };
}

/**
 * Validate model parameters and merge with defaults
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Next middleware function
 */
function validateAndMergeModelParams(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  if (req.body.modelParams) {
    const validated = validateModelParams(req.body.modelParams);
    req.body.modelParams = { ...DEFAULT_MODEL_PARAMS, ...validated };
  }
  next();
}

export { schemas, validate, validateAndMergeModelParams };
export default {
  validate,
  validateAndMergeModelParams,
  schemas,
};
