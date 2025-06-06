import { Request, Response } from "express";
import fileService from "../services/fileService";
import type {
  PrepromptByIdRequest,
  PrepromptCreateRequest,
  PrepromptUpdateRequest,
} from "../types/controllers";
import type { Preprompt } from "../types/interfaces";
import { generateId } from "../utils/helpers";
import { safeLogger } from "../utils/safeLogger"; // Use safe logger instead

interface PrepromptsListResponse {
  preprompts: Preprompt[];
  count: number;
  metadata?: {
    lastModified?: string;
    totalSize?: number;
    searchQuery?: string;
    totalAvailable?: number;
  };
}

interface PrepromptResponse {
  preprompt: Preprompt;
  message?: string;
}

interface PrepromptCreateResponse {
  preprompt: Preprompt;
  message: string;
}

interface PrepromptUpdateResponse {
  preprompt: Preprompt;
  message: string;
  changes?: string[];
}

interface PrepromptDeleteResponse {
  success: true;
  message: string;
  deletedPreprompt: Preprompt;
}

interface ErrorResponse {
  error: string;
  code: string;
  timestamp?: string;
}

/**
 * Get all preprompts
 */
const getAll = async (_req: Request, res: Response): Promise<void> => {
  try {
    const preprompts = fileService.loadPreprompts();

    safeLogger.debug("Preprompts retrieved", {
      count: preprompts.length,
      ids: preprompts.map((p) => p.id),
    });

    const response: PrepromptsListResponse = {
      preprompts,
      count: preprompts.length,
      metadata: {
        lastModified: new Date().toISOString(),
        totalSize: JSON.stringify(preprompts).length,
      },
    };

    res.json(response);
  } catch (error) {
    safeLogger.error("Error retrieving preprompts:", error);

    const errorResponse: ErrorResponse = {
      error: "Erreur lors de la récupération des preprompts",
      code: "PREPROMPTS_RETRIEVAL_ERROR",
      timestamp: new Date().toISOString(),
    };

    res.status(500).json(errorResponse);
  }
};

/**
 * Create a new preprompt
 */
const create = async (
  req: PrepromptCreateRequest,
  res: Response
): Promise<void> => {
  try {
    const { name, content } = req.body;

    // Validation des données d'entrée
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      res.status(400).json({
        error: "Le nom du preprompt est requis",
        code: "INVALID_PREPROMPT_NAME",
      });
      return;
    }

    if (
      !content ||
      typeof content !== "string" ||
      content.trim().length === 0
    ) {
      res.status(400).json({
        error: "Le contenu du preprompt est requis",
        code: "INVALID_PREPROMPT_CONTENT",
      });
      return;
    }

    // Validation de la longueur
    if (name.length > 100) {
      res.status(400).json({
        error: "Le nom du preprompt ne peut pas dépasser 100 caractères",
        code: "PREPROMPT_NAME_TOO_LONG",
      });
      return;
    }

    if (content.length > 10000) {
      res.status(400).json({
        error: "Le contenu du preprompt ne peut pas dépasser 10000 caractères",
        code: "PREPROMPT_CONTENT_TOO_LONG",
      });
      return;
    }

    const preprompts = fileService.loadPreprompts();

    // Check if name already exists
    const existingPreprompt = preprompts.find(
      (p) => p.name.toLowerCase() === name.toLowerCase()
    );
    if (existingPreprompt) {
      res.status(409).json({
        error: "Un preprompt avec ce nom existe déjà",
        code: "PREPROMPT_NAME_EXISTS",
      });
      return;
    }

    const newPreprompt: Preprompt = {
      id: generateId(),
      name: name.trim(),
      content: content.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    preprompts.push(newPreprompt);

    const saved = fileService.savePreprompts(preprompts);
    if (saved) {
      safeLogger.info("Preprompt created", {
        id: newPreprompt.id,
        name: newPreprompt.name,
        contentLength: newPreprompt.content.length,
      });

      const response: PrepromptCreateResponse = {
        preprompt: newPreprompt,
        message: "Preprompt créé avec succès",
      };

      res.status(201).json(response);
    } else {
      throw new Error("Failed to save preprompts");
    }
  } catch (error) {
    safeLogger.error("Error creating preprompt:", error);

    const errorResponse: ErrorResponse = {
      error: "Erreur lors de la création du preprompt",
      code: "PREPROMPT_CREATION_ERROR",
      timestamp: new Date().toISOString(),
    };

    res.status(500).json(errorResponse);
  }
};

/**
 * Update an existing preprompt
 */
const update = async (
  req: PrepromptUpdateRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, content } = req.body;

    if (!id) {
      res.status(400).json({
        error: "ID du preprompt requis",
        code: "MISSING_PREPROMPT_ID",
      });
      return;
    }

    // Validation des données partielles
    if (
      name !== undefined &&
      (typeof name !== "string" || name.trim().length === 0)
    ) {
      res.status(400).json({
        error: "Le nom du preprompt doit être une chaîne non vide",
        code: "INVALID_PREPROMPT_NAME",
      });
      return;
    }

    if (
      content !== undefined &&
      (typeof content !== "string" || content.trim().length === 0)
    ) {
      res.status(400).json({
        error: "Le contenu du preprompt doit être une chaîne non vide",
        code: "INVALID_PREPROMPT_CONTENT",
      });
      return;
    }

    const preprompts = fileService.loadPreprompts();
    const prepromptIndex = preprompts.findIndex((p) => p.id === id);

    if (prepromptIndex === -1) {
      res.status(404).json({
        error: "Preprompt non trouvé",
        code: "PREPROMPT_NOT_FOUND",
      });
      return;
    }

    const currentPreprompt = preprompts[prepromptIndex];
    const changes: string[] = [];

    // Check if new name already exists (excluding current preprompt)
    if (name && name !== currentPreprompt.name) {
      const existingPreprompt = preprompts.find(
        (p) => p.name.toLowerCase() === name.toLowerCase() && p.id !== id
      );
      if (existingPreprompt) {
        res.status(409).json({
          error: "Un preprompt avec ce nom existe déjà",
          code: "PREPROMPT_NAME_EXISTS",
        });
        return;
      }
      changes.push("name");
    }

    if (content && content !== currentPreprompt.content) {
      changes.push("content");
    }

    // Update preprompt
    const updatedPreprompt: Preprompt = {
      ...currentPreprompt,
      name: name ? name.trim() : currentPreprompt.name,
      content: content ? content.trim() : currentPreprompt.content,
      updatedAt: new Date().toISOString(),
      createdAt: currentPreprompt.createdAt || new Date().toISOString(), // Ensure createdAt exists
    };

    preprompts[prepromptIndex] = updatedPreprompt;

    const saved = fileService.savePreprompts(preprompts);
    if (saved) {
      safeLogger.info("Preprompt updated", {
        id,
        name: updatedPreprompt.name,
        changes,
      });

      const response: PrepromptUpdateResponse = {
        preprompt: updatedPreprompt,
        message: "Preprompt mis à jour avec succès",
        changes,
      };

      res.json(response);
    } else {
      throw new Error("Failed to save preprompts");
    }
  } catch (error) {
    safeLogger.error("Error updating preprompt:", error);

    const errorResponse: ErrorResponse = {
      error: "Erreur lors de la mise à jour du preprompt",
      code: "PREPROMPT_UPDATE_ERROR",
      timestamp: new Date().toISOString(),
    };

    res.status(500).json(errorResponse);
  }
};

/**
 * Delete a preprompt
 */
const deletePreprompt = async (
  req: PrepromptByIdRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        error: "ID du preprompt requis",
        code: "MISSING_PREPROMPT_ID",
      });
      return;
    }

    const preprompts = fileService.loadPreprompts();
    const prepromptIndex = preprompts.findIndex((p) => p.id === id);

    if (prepromptIndex === -1) {
      res.status(404).json({
        error: "Preprompt non trouvé",
        code: "PREPROMPT_NOT_FOUND",
      });
      return;
    }

    const deletedPreprompt = preprompts[prepromptIndex];
    const filteredPreprompts = preprompts.filter((p) => p.id !== id);

    const saved = fileService.savePreprompts(filteredPreprompts);
    if (saved) {
      safeLogger.info("Preprompt deleted", {
        id: deletedPreprompt.id,
        name: deletedPreprompt.name,
        remainingCount: filteredPreprompts.length,
      });

      const response: PrepromptDeleteResponse = {
        success: true,
        message: "Preprompt supprimé avec succès",
        deletedPreprompt,
      };

      res.json(response);
    } else {
      throw new Error("Failed to save preprompts");
    }
  } catch (error) {
    safeLogger.error("Error deleting preprompt:", error);

    const errorResponse: ErrorResponse = {
      error: "Erreur lors de la suppression du preprompt",
      code: "PREPROMPT_DELETION_ERROR",
      timestamp: new Date().toISOString(),
    };

    res.status(500).json(errorResponse);
  }
};

/**
 * Get a specific preprompt by ID
 */
const getById = async (
  req: PrepromptByIdRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        error: "ID du preprompt requis",
        code: "MISSING_PREPROMPT_ID",
      });
      return;
    }

    const preprompts = fileService.loadPreprompts();
    const preprompt = preprompts.find((p) => p.id === id);

    if (!preprompt) {
      res.status(404).json({
        error: "Preprompt non trouvé",
        code: "PREPROMPT_NOT_FOUND",
      });
      return;
    }

    safeLogger.debug("Preprompt retrieved by ID", {
      id: preprompt.id,
      name: preprompt.name,
    });

    const response: PrepromptResponse = { preprompt };
    res.json(response);
  } catch (error) {
    safeLogger.error("Error retrieving preprompt:", error);

    const errorResponse: ErrorResponse = {
      error: "Erreur lors de la récupération du preprompt",
      code: "PREPROMPT_RETRIEVAL_ERROR",
      timestamp: new Date().toISOString(),
    };

    res.status(500).json(errorResponse);
  }
};

/**
 * Search preprompts by name or content
 */
const search = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q: query, limit = "10" } = req.query;

    if (!query || typeof query !== "string") {
      res.status(400).json({
        error: "Paramètre de recherche 'q' requis",
        code: "MISSING_SEARCH_QUERY",
      });
      return;
    }

    const searchLimit = Math.min(parseInt(limit as string) || 10, 50);
    const preprompts = fileService.loadPreprompts();

    const searchTerm = query.toLowerCase();
    const filteredPreprompts = preprompts
      .filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm) ||
          p.content.toLowerCase().includes(searchTerm)
      )
      .slice(0, searchLimit);

    safeLogger.debug("Preprompts search completed", {
      query: searchTerm,
      totalResults: filteredPreprompts.length,
      limit: searchLimit,
    });

    const response: PrepromptsListResponse = {
      preprompts: filteredPreprompts,
      count: filteredPreprompts.length,
      metadata: {
        searchQuery: query,
        totalAvailable: preprompts.length,
      },
    };

    res.json(response);
  } catch (error) {
    safeLogger.error("Error searching preprompts:", error);

    const errorResponse: ErrorResponse = {
      error: "Erreur lors de la recherche de preprompts",
      code: "PREPROMPT_SEARCH_ERROR",
      timestamp: new Date().toISOString(),
    };

    res.status(500).json(errorResponse);
  }
};

export { create, deletePreprompt as delete, getAll, getById, search, update };

export default {
  getAll,
  create,
  update,
  delete: deletePreprompt,
  getById,
  search,
};
