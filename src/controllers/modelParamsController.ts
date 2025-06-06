import { Request, Response } from "express";
import { DEFAULT_MODEL_PARAMS, PARAM_LIMITS } from "../config/constants";
import fileService from "../services/fileService";
import type {
  ControllerFunction,
  ModelParamsUpdateRequest,
  ModelParamsValidateRequest,
} from "../types/controllers";
import type { ModelParams } from "../types/interfaces";
import { validateModelParams } from "../utils/helpers";
import { safeLogger } from "../utils/safeLogger"; // Use safe logger instead

// Define ParamLimitsConfig locally since it's not exported
interface ParamLimitsConfig {
  [key: string]: any; // Replace with your actual structure
}

interface ModelParamsResponse {
  modelParams: ModelParams;
  defaults: ModelParams;
}

interface ModelParamsUpdateResponse {
  modelParams: ModelParams;
  message: string;
  updatedFields: string[];
}

interface ModelParamsLimitsResponse {
  limits: ParamLimitsConfig;
  defaults: ModelParams;
}

interface ModelParamsValidationResponse {
  valid: boolean;
  validatedParams: Partial<ModelParams>;
  invalidFields: string[];
  errors?: string[];
}

interface ErrorResponse {
  error: string;
  code: string;
  timestamp?: string;
}

/**
 * Get current model parameters
 */
const get: ControllerFunction = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const params = fileService.loadModelParams();

    safeLogger.debug("Model parameters retrieved", {
      parametersCount: Object.keys(params).length,
    });

    const response: ModelParamsResponse = {
      modelParams: params,
      defaults: DEFAULT_MODEL_PARAMS,
    };

    res.json(response);
  } catch (error) {
    safeLogger.error("Error retrieving model parameters:", error);

    const errorResponse: ErrorResponse = {
      error: "Erreur lors de la récupération des paramètres",
      code: "MODEL_PARAMS_RETRIEVAL_ERROR",
      timestamp: new Date().toISOString(),
    };

    res.status(500).json(errorResponse);
  }
};

/**
 * Update model parameters
 */
const update: ControllerFunction = async (
  req: ModelParamsUpdateRequest,
  res: Response
): Promise<void> => {
  try {
    const inputParams = req.body;

    if (!inputParams || typeof inputParams !== "object") {
      res.status(400).json({
        error: "Corps de requête invalide",
        code: "INVALID_REQUEST_BODY",
      });
      return;
    }

    // Validate and clamp parameters
    const validatedParams = validateModelParams(inputParams);

    if (Object.keys(validatedParams).length === 0) {
      res.status(400).json({
        error: "Aucun paramètre valide fourni",
        code: "NO_VALID_PARAMS",
      });
      return;
    }

    // Merge with current parameters
    const currentParams = fileService.loadModelParams();
    const updatedParams: ModelParams = { ...currentParams, ...validatedParams };

    const saved = fileService.saveModelParams(updatedParams);

    if (saved) {
      safeLogger.info("Model parameters updated", {
        updatedFields: Object.keys(validatedParams),
        newParams: updatedParams,
      });

      const response: ModelParamsUpdateResponse = {
        modelParams: updatedParams,
        message: "Paramètres mis à jour avec succès",
        updatedFields: Object.keys(validatedParams),
      };

      res.json(response);
    } else {
      throw new Error("Failed to save model parameters");
    }
  } catch (error) {
    safeLogger.error("Error updating model parameters:", error);

    const errorResponse: ErrorResponse = {
      error: "Erreur lors de la sauvegarde des paramètres",
      code: "MODEL_PARAMS_UPDATE_ERROR",
      timestamp: new Date().toISOString(),
    };

    res.status(500).json(errorResponse);
  }
};

/**
 * Reset parameters to defaults
 */
const reset: ControllerFunction = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const saved = fileService.saveModelParams(DEFAULT_MODEL_PARAMS);

    if (saved) {
      safeLogger.info("Model parameters reset to defaults");

      const response: ModelParamsUpdateResponse = {
        modelParams: DEFAULT_MODEL_PARAMS,
        message: "Paramètres réinitialisés aux valeurs par défaut",
        updatedFields: Object.keys(DEFAULT_MODEL_PARAMS),
      };

      res.json(response);
    } else {
      throw new Error("Failed to reset model parameters");
    }
  } catch (error) {
    safeLogger.error("Error resetting model parameters:", error);

    const errorResponse: ErrorResponse = {
      error: "Erreur lors de la réinitialisation",
      code: "MODEL_PARAMS_RESET_ERROR",
      timestamp: new Date().toISOString(),
    };

    res.status(500).json(errorResponse);
  }
};

/**
 * Get parameter validation limits
 */
const getLimits: ControllerFunction = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const response: ModelParamsLimitsResponse = {
      limits: PARAM_LIMITS,
      defaults: DEFAULT_MODEL_PARAMS,
    };

    safeLogger.debug("Parameter limits retrieved");
    res.json(response);
  } catch (error) {
    safeLogger.error("Error retrieving parameter limits:", error);

    const errorResponse: ErrorResponse = {
      error: "Erreur lors de la récupération des limites",
      code: "PARAM_LIMITS_ERROR",
      timestamp: new Date().toISOString(),
    };

    res.status(500).json(errorResponse);
  }
};

/**
 * Validate parameters without saving
 */
const validateParams: ControllerFunction = async (
  req: ModelParamsValidateRequest,
  res: Response
): Promise<void> => {
  try {
    const inputParams = req.body;

    if (!inputParams || typeof inputParams !== "object") {
      res.status(400).json({
        error: "Corps de requête invalide",
        code: "INVALID_REQUEST_BODY",
      });
      return;
    }

    const validatedParams = validateModelParams(inputParams);
    const inputKeys = Object.keys(inputParams);
    const validKeys = Object.keys(validatedParams);
    const invalidFields = inputKeys.filter((key) => !validKeys.includes(key));

    const errors =
      invalidFields.length > 0
        ? [`Champs invalides: ${invalidFields.join(", ")}`]
        : undefined;

    const response: ModelParamsValidationResponse = {
      valid: validKeys.length > 0,
      validatedParams,
      invalidFields,
      ...(errors && { errors }), // Only include errors if they exist
    };

    safeLogger.debug("Parameters validation completed", {
      inputFieldsCount: inputKeys.length,
      validFieldsCount: validKeys.length,
      invalidFieldsCount: invalidFields.length,
    });

    res.json(response);
  } catch (error) {
    safeLogger.error("Error validating parameters:", error);

    const errorResponse: ErrorResponse = {
      error: "Erreur lors de la validation",
      code: "PARAM_VALIDATION_ERROR",
      timestamp: new Date().toISOString(),
    };

    res.status(500).json(errorResponse);
  }
};

/**
 * Get parameter information and metadata
 */
const getInfo: ControllerFunction = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const currentParams = fileService.loadModelParams();

    const response = {
      current: currentParams,
      defaults: DEFAULT_MODEL_PARAMS,
      limits: PARAM_LIMITS,
      metadata: {
        availableParams: Object.keys(DEFAULT_MODEL_PARAMS),
        lastModified: new Date().toISOString(), // Vous pourriez stocker cela dans le fichier
      },
    };

    res.json(response);
  } catch (error) {
    safeLogger.error("Error retrieving parameter info:", error);

    const errorResponse: ErrorResponse = {
      error: "Erreur lors de la récupération des informations",
      code: "PARAM_INFO_ERROR",
      timestamp: new Date().toISOString(),
    };

    res.status(500).json(errorResponse);
  }
};

export { get, getInfo, getLimits, reset, update, validateParams as validate };

export default {
  get,
  update,
  reset,
  getLimits,
  validate: validateParams,
  getInfo,
};
