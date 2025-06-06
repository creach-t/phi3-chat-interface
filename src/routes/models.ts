import { Router } from 'express';
import * as modelsController from '../controllers/modelsController';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(requireAuth);

// Routes des modèles
router.get('/', modelsController.listModels);
router.post('/download', modelsController.downloadModel);
router.post('/activate', modelsController.setActiveModel);
router.delete('/:filename', modelsController.deleteModel);

// Routes des téléchargements
router.get('/downloads', modelsController.getDownloadStatus);
router.get('/downloads/:downloadId', modelsController.getDownloadStatus);
router.post('/downloads/:downloadId/cancel', modelsController.cancelDownload);
router.post('/downloads/cleanup', modelsController.cleanupDownloads);

export default router;
