import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import config from '../config';

export interface ModelInfo {
  name: string;
  filename: string;
  size: number;
  path: string;
  isActive: boolean;
  downloadDate?: Date;
}

export interface DownloadProgress {
  id: string;
  url: string;
  filename: string;
  progress: number;
  status: 'downloading' | 'completed' | 'error' | 'cancelled';
  error?: string;
}

class ModelManager {
  private modelsDir: string;
  private activeDownloads: Map<string, DownloadProgress> = new Map();

  constructor() {
    this.modelsDir = path.join(process.cwd(), 'models');
    this.ensureModelsDir();
  }

  private ensureModelsDir(): void {
    if (!fs.existsSync(this.modelsDir)) {
      fs.mkdirSync(this.modelsDir, { recursive: true });
    }
  }

  /**
   * Liste tous les modèles disponibles
   */
  public listModels(): ModelInfo[] {
    const files = fs.readdirSync(this.modelsDir);
    const ggufFiles = files.filter(file => file.endsWith('.gguf'));
    
    return ggufFiles.map(filename => {
      const filePath = path.join(this.modelsDir, filename);
      const stats = fs.statSync(filePath);
      const isActive = config.modelPath === filePath;
      
      return {
        name: filename.replace('.gguf', ''),
        filename,
        size: stats.size,
        path: filePath,
        isActive,
        downloadDate: stats.birthtime
      };
    });
  }

  /**
   * Télécharge un modèle depuis Hugging Face
   */
  public async downloadModel(url: string, filename?: string): Promise<string> {
    // Extraire le nom du fichier depuis l'URL si pas fourni
    if (!filename) {
      const urlParts = url.split('/');
      filename = urlParts[urlParts.length - 1];
    }

    // Validation de l'URL Hugging Face
    if (!url.includes('huggingface.co') || !filename.endsWith('.gguf')) {
      throw new Error('URL invalide. Utilisez un lien direct vers un fichier .gguf depuis Hugging Face.');
    }

    const downloadId = Date.now().toString();
    const outputPath = path.join(this.modelsDir, filename);

    // Vérifier si le fichier existe déjà
    if (fs.existsSync(outputPath)) {
      throw new Error(`Le modèle ${filename} existe déjà.`);
    }

    // Initialiser le suivi du téléchargement
    const progress: DownloadProgress = {
      id: downloadId,
      url,
      filename,
      progress: 0,
      status: 'downloading'
    };
    this.activeDownloads.set(downloadId, progress);

    try {
      await this.downloadFile(url, outputPath, downloadId);
      progress.status = 'completed';
      progress.progress = 100;
      
      return downloadId;
    } catch (error) {
      progress.status = 'error';
      progress.error = error instanceof Error ? error.message : 'Erreur inconnue';
      
      // Nettoyer le fichier partiel
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }
      
      throw error;
    }
  }

  /**
   * Télécharge un fichier avec curl et suivi du progrès
   */
  private downloadFile(url: string, outputPath: string, downloadId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const curl = spawn('curl', [
        '-L', // Suivre les redirections
        '-o', outputPath,
        '--progress-bar',
        '--fail', // Échouer en cas d'erreur HTTP
        url
      ]);

      curl.stderr.on('data', (data: Buffer) => {
        const output = data.toString();
        // Parser le progrès de curl (format: ######## 45.2%)
        const progressMatch = output.match(/(\d+\.\d+)%/);
        if (progressMatch) {
          const progress = parseFloat(progressMatch[1]);
          const downloadProgress = this.activeDownloads.get(downloadId);
          if (downloadProgress) {
            downloadProgress.progress = progress;
          }
        }
      });

      curl.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Échec du téléchargement (code: ${code})`));
        }
      });

      curl.on('error', (error) => {
        reject(new Error(`Erreur curl: ${error.message}`));
      });
    });
  }

  /**
   * Change le modèle actif
   */
  public setActiveModel(filename: string): boolean {
    const modelPath = path.join(this.modelsDir, filename);
    
    if (!fs.existsSync(modelPath)) {
      throw new Error(`Le modèle ${filename} n'existe pas.`);
    }

    // Mettre à jour la configuration (ici on pourrait sauver dans un fichier de config)
    config.modelPath = modelPath;
    
    return true;
  }

  /**
   * Supprime un modèle
   */
  public deleteModel(filename: string): boolean {
    const modelPath = path.join(this.modelsDir, filename);
    
    if (!fs.existsSync(modelPath)) {
      throw new Error(`Le modèle ${filename} n'existe pas.`);
    }

    // Empêcher la suppression du modèle actif
    if (config.modelPath === modelPath) {
      throw new Error('Impossible de supprimer le modèle actuellement utilisé.');
    }

    fs.unlinkSync(modelPath);
    return true;
  }

  /**
   * Obtient le statut d'un téléchargement
   */
  public getDownloadProgress(downloadId: string): DownloadProgress | undefined {
    return this.activeDownloads.get(downloadId);
  }

  /**
   * Obtient tous les téléchargements actifs
   */
  public getActiveDownloads(): DownloadProgress[] {
    return Array.from(this.activeDownloads.values());
  }

  /**
   * Annule un téléchargement
   */
  public cancelDownload(downloadId: string): boolean {
    const download = this.activeDownloads.get(downloadId);
    if (download && download.status === 'downloading') {
      download.status = 'cancelled';
      return true;
    }
    return false;
  }

  /**
   * Nettoie les téléchargements terminés
   */
  public cleanupDownloads(): void {
    for (const [id, download] of this.activeDownloads.entries()) {
      if (download.status !== 'downloading') {
        this.activeDownloads.delete(id);
      }
    }
  }

  /**
   * Obtient des informations sur l'espace disque
   */
  public getDiskSpace(): { total: number; free: number; used: number } {
    const stats = fs.statSync(this.modelsDir);
    // Note: cette méthode est basique, pour un vrai calcul d'espace disque,
    // il faudrait utiliser une lib comme 'statvfs' ou une commande système
    return {
      total: 0, // À implémenter si nécessaire
      free: 0,
      used: this.getTotalModelsSize()
    };
  }

  private getTotalModelsSize(): number {
    const models = this.listModels();
    return models.reduce((total, model) => total + model.size, 0);
  }
}

// Instance singleton
const modelManager = new ModelManager();
export default modelManager;
