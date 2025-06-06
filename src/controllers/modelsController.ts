import { Request, Response } from 'express';
import modelManager from '../services/modelManager';
import Joi from 'joi';

// Schémas de validation
const downloadSchema = Joi.object({
  url: Joi.string().uri().required(),
  filename: Joi.string().optional()
});

const setActiveSchema = Joi.object({
  filename: Joi.string().required()
});

/**
 * Liste tous les modèles disponibles
 */
export const listModels = (req: Request, res: Response): void => {
  try {
    const models = modelManager.listModels();
    res.json({
      success: true,
      models,
      count: models.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
};

/**
 * Télécharge un nouveau modèle
 */
export const downloadModel = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = downloadSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        error: error.details[0].message
      });
      return;
    }

    const { url, filename } = value;
    const downloadId = await modelManager.downloadModel(url, filename);
    
    res.json({
      success: true,
      downloadId,
      message: 'Téléchargement démarré'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur de téléchargement'
    });
  }
};

/**
 * Change le modèle actif
 */
export const setActiveModel = (req: Request, res: Response): void => {
  try {
    const { error, value } = setActiveSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        error: error.details[0].message
      });
      return;
    }

    const { filename } = value;
    modelManager.setActiveModel(filename);
    
    res.json({
      success: true,
      message: `Modèle ${filename} activé`
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur d\'activation'
    });
  }
};

/**
 * Supprime un modèle
 */
export const deleteModel = (req: Request, res: Response): void => {
  try {
    const { filename } = req.params;
    
    if (!filename) {
      res.status(400).json({
        success: false,
        error: 'Nom de fichier requis'
      });
      return;
    }

    modelManager.deleteModel(filename);
    
    res.json({
      success: true,
      message: `Modèle ${filename} supprimé`
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur de suppression'
    });
  }
};

/**
 * Obtient le statut des téléchargements
 */
export const getDownloadStatus = (req: Request, res: Response): void => {
  try {
    const { downloadId } = req.params;
    
    if (downloadId) {
      const progress = modelManager.getDownloadProgress(downloadId);
      if (!progress) {
        res.status(404).json({
          success: false,
          error: 'Téléchargement non trouvé'
        });
        return;
      }
      res.json({ success: true, progress });
    } else {
      const activeDownloads = modelManager.getActiveDownloads();
      res.json({ success: true, downloads: activeDownloads });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur de statut'
    });
  }
};

/**
 * Annule un téléchargement
 */
export const cancelDownload = (req: Request, res: Response): void => {
  try {
    const { downloadId } = req.params;
    
    if (!downloadId) {
      res.status(400).json({
        success: false,
        error: 'ID de téléchargement requis'
      });
      return;
    }

    const cancelled = modelManager.cancelDownload(downloadId);
    
    if (cancelled) {
      res.json({
        success: true,
        message: 'Téléchargement annulé'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Impossible d\'annuler le téléchargement'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur d\'annulation'
    });
  }
};

/**
 * Nettoie les téléchargements terminés
 */
export const cleanupDownloads = (req: Request, res: Response): void => {
  try {
    modelManager.cleanupDownloads();
    res.json({
      success: true,
      message: 'Téléchargements nettoyés'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur de nettoyage'
    });
  }
};
