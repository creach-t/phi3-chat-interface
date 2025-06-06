// Types pour la validation des données

// Schémas de validation disponibles
export type ValidationSchema = "modelParams" | "preprompt" | "chat" | "login";

// Interface de base pour tous les schémas
export interface BaseValidationSchema {
  type: "object";
  required: string[];
  properties: Record<string, ValidationProperty>;
  additionalProperties?: boolean;
}

// Types de propriétés supportés dans la validation
export interface ValidationProperty {
  type: "string" | "number" | "boolean" | "object" | "array";
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  enum?: (string | number)[];
  items?: ValidationProperty;
  properties?: Record<string, ValidationProperty>;
}

// Schéma pour les paramètres de modèle
export interface ModelParamsValidationSchema extends BaseValidationSchema {
  properties: {
    temperature?: ValidationProperty;
    maxTokens?: ValidationProperty;
    topP?: ValidationProperty;
    topK?: ValidationProperty;
    repetitionPenalty?: ValidationProperty;
    stopSequences?: ValidationProperty;
  };
}

// Schéma pour les preprompts
export interface PrepromptValidationSchema extends BaseValidationSchema {
  properties: {
    name: ValidationProperty;
    content: ValidationProperty;
  };
}

// Schéma pour les messages de chat
export interface ChatValidationSchema extends BaseValidationSchema {
  properties: {
    message: ValidationProperty;
    prepromptId?: ValidationProperty;
    modelParams?: ValidationProperty;
  };
}

// Schéma pour le login
export interface LoginValidationSchema extends BaseValidationSchema {
  properties: {
    username: ValidationProperty;
    password: ValidationProperty;
  };
}

// Résultat de validation
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  data?: any;
}

// Erreur de validation détaillée
export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
  rule?: string;
}

// Définitions des schémas concrets
export const validationSchemas: Record<ValidationSchema, BaseValidationSchema> =
  {
    modelParams: {
      type: "object",
      required: [],
      additionalProperties: false,
      properties: {
        temperature: {
          type: "number",
          minimum: 0.1,
          maximum: 2.0,
        },
        maxTokens: {
          type: "number",
          minimum: 1,
          maximum: 4096,
        },
        topP: {
          type: "number",
          minimum: 0.1,
          maximum: 1.0,
        },
        topK: {
          type: "number",
          minimum: 1,
          maximum: 100,
        },
        repetitionPenalty: {
          type: "number",
          minimum: 0.1,
          maximum: 2.0,
        },
        stopSequences: {
          type: "array",
          items: {
            type: "string",
            maxLength: 20,
          },
        },
      },
    },

    preprompt: {
      type: "object",
      required: ["name", "content"],
      additionalProperties: false,
      properties: {
        name: {
          type: "string",
          minLength: 1,
          maxLength: 100,
          pattern: "^[a-zA-Z0-9\\s\\-_]+$",
        },
        content: {
          type: "string",
          minLength: 1,
          maxLength: 10000,
        },
      },
    },

    chat: {
      type: "object",
      required: ["message"],
      additionalProperties: false,
      properties: {
        message: {
          type: "string",
          minLength: 1,
          maxLength: 5000,
        },
        prepromptId: {
          type: "string",
          pattern: "^[a-zA-Z0-9]+$",
        },
        modelParams: {
          type: "object",
          properties: validationSchemas.modelParams.properties,
        },
      },
    },

    login: {
      type: "object",
      required: ["username", "password"],
      additionalProperties: false,
      properties: {
        username: {
          type: "string",
          minLength: 1,
          maxLength: 50,
          pattern: "^[a-zA-Z0-9_\\-]+$",
        },
        password: {
          type: "string",
          minLength: 1,
          maxLength: 100,
        },
      },
    },
  };

// Fonctions de validation spécialisées
export function validateModelParams(data: unknown): ValidationResult {
  return validateData(data, validationSchemas.modelParams);
}

export function validatePreprompt(data: unknown): ValidationResult {
  return validateData(data, validationSchemas.preprompt);
}

export function validateChatMessage(data: unknown): ValidationResult {
  return validateData(data, validationSchemas.chat);
}

export function validateLogin(data: unknown): ValidationResult {
  return validateData(data, validationSchemas.login);
}

// Fonction générique de validation
export function validateData(
  data: unknown,
  schema: BaseValidationSchema
): ValidationResult {
  const errors: ValidationError[] = [];

  if (typeof data !== "object" || data === null) {
    return {
      isValid: false,
      errors: [{ field: "root", message: "Data must be an object" }],
    };
  }

  const obj = data as Record<string, unknown>;

  // Vérifier les champs requis
  for (const requiredField of schema.required) {
    if (!(requiredField in obj)) {
      errors.push({
        field: requiredField,
        message: `Field '${requiredField}' is required`,
      });
    }
  }

  // Vérifier les propriétés
  for (const [field, value] of Object.entries(obj)) {
    const propertySchema = schema.properties[field];

    if (!propertySchema) {
      if (!schema.additionalProperties) {
        errors.push({
          field,
          message: `Field '${field}' is not allowed`,
          value,
        });
      }
      continue;
    }

    const fieldErrors = validateProperty(value, propertySchema, field);
    errors.push(...fieldErrors);
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: errors.length === 0 ? obj : undefined,
  };
}

// Validation d'une propriété individuelle
function validateProperty(
  value: unknown,
  schema: ValidationProperty,
  fieldName: string
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Vérifier le type
  if (typeof value !== schema.type) {
    errors.push({
      field: fieldName,
      message: `Expected type '${schema.type}', got '${typeof value}'`,
      value,
      rule: "type",
    });
    return errors; // Arrêter si le type est incorrect
  }

  // Validations spécifiques par type
  if (schema.type === "string" && typeof value === "string") {
    if (schema.minLength && value.length < schema.minLength) {
      errors.push({
        field: fieldName,
        message: `Minimum length is ${schema.minLength}`,
        value,
        rule: "minLength",
      });
    }

    if (schema.maxLength && value.length > schema.maxLength) {
      errors.push({
        field: fieldName,
        message: `Maximum length is ${schema.maxLength}`,
        value,
        rule: "maxLength",
      });
    }

    if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
      errors.push({
        field: fieldName,
        message: `Value does not match pattern ${schema.pattern}`,
        value,
        rule: "pattern",
      });
    }
  }

  if (schema.type === "number" && typeof value === "number") {
    if (schema.minimum && value < schema.minimum) {
      errors.push({
        field: fieldName,
        message: `Minimum value is ${schema.minimum}`,
        value,
        rule: "minimum",
      });
    }

    if (schema.maximum && value > schema.maximum) {
      errors.push({
        field: fieldName,
        message: `Maximum value is ${schema.maximum}`,
        value,
        rule: "maximum",
      });
    }
  }

  if (schema.enum && !schema.enum.includes(value as string | number)) {
    errors.push({
      field: fieldName,
      message: `Value must be one of: ${schema.enum.join(", ")}`,
      value,
      rule: "enum",
    });
  }

  return errors;
}

// Helper pour créer des erreurs de validation
export function createValidationError(
  field: string,
  message: string,
  value?: unknown,
  rule?: string
): ValidationError {
  return { field, message, value, rule };
}

// Export par défaut
export default {
  validationSchemas,
  validateModelParams,
  validatePreprompt,
  validateChatMessage,
  validateLogin,
  validateData,
  createValidationError,
};
