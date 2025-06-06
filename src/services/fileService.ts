import fs from "fs";
import path from "path";
import config from "../config";
import { DEFAULT_MODEL_PARAMS } from "../config/constants";
import { ModelParams, Preprompt } from "../types/interfaces";
import { safeJsonParse } from "../utils/helpers";

// Safe logger import with fallback
const createSafeLogger = () => {
  try {
    const importedLogger = require("../utils/logger").default;
    if (importedLogger && typeof importedLogger.info === 'function') {
      return importedLogger;
    }
  } catch (error) {
    // Ignore import errors
  }
  
  // Fallback logger
  return {
    info: (message: string, meta?: any) => console.log(`[INFO] ${message}`, meta || ''),
    error: (message: string, error?: any) => console.error(`[ERROR] ${message}`, error || ''),
    warn: (message: string, meta?: any) => console.warn(`[WARN] ${message}`, meta || ''),
    debug: (message: string, meta?: any) => console.log(`[DEBUG] ${message}`, meta || '')
  };
};

const logger = createSafeLogger();

class FileService {
  private readonly dataDir: string;

  constructor() {
    this.dataDir = config.data.dir;
    this.ensureDataDir();
  }

  /**
   * Ensure data directory exists
   */
  ensureDataDir(): void {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
      logger.info(`Created data directory: ${this.dataDir}`);
    }
  }

  /**
   * Get full path for a data file
   * @param filename - Name of the file
   * @returns Full path to the file
   */
  getDataPath(filename: string): string {
    return path.join(this.dataDir, filename);
  }

  /**
   * Load JSON data from file
   * @param filename - Name of the JSON file
   * @param defaultValue - Default value if file doesn't exist
   * @returns Parsed JSON data or default value
   */
  loadJson<T>(filename: string, defaultValue: T = [] as T): T {
    try {
      const filePath = this.getDataPath(filename);
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, "utf8");
        return safeJsonParse<T>(data, defaultValue) ?? defaultValue;
      }
      logger.info(`File ${filename} doesn't exist, using default value`);
      return defaultValue;
    } catch (error) {
      logger.error(
        `Error loading ${filename}:`,
        error instanceof Error ? error : new Error(String(error))
      );
      return defaultValue;
    }
  }

  /**
   * Save JSON data to file
   * @param filename - Name of the JSON file
   * @param data - Data to save
   * @returns Success status
   */
  saveJson(filename: string, data: unknown): boolean {
    try {
      const filePath = this.getDataPath(filename);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
      logger.info(`Successfully saved ${filename}`);
      return true;
    } catch (error) {
      logger.error(
        `Error saving ${filename}:`,
        error instanceof Error ? error : new Error(String(error))
      );
      return false;
    }
  }

  /**
   * Load preprompts from file
   * @returns Array of preprompts
   */
  loadPreprompts(): Preprompt[] {
    return this.loadJson<Preprompt[]>(config.data.prepromptsFile, []);
  }

  /**
   * Save preprompts to file
   * @param preprompts - Array of preprompts
   * @returns Success status
   */
  savePreprompts(preprompts: Preprompt[]): boolean {
    return this.saveJson(config.data.prepromptsFile, preprompts);
  }

  /**
   * Load model parameters from file
   * @returns Model parameters
   */
  loadModelParams(): ModelParams {
    const saved = this.loadJson<Partial<ModelParams>>(
      config.data.modelParamsFile,
      {}
    );
    return { ...DEFAULT_MODEL_PARAMS, ...saved };
  }

  /**
   * Save model parameters to file
   * @param params - Model parameters
   * @returns Success status
   */
  saveModelParams(params: ModelParams | Partial<ModelParams>): boolean {
    return this.saveJson(config.data.modelParamsFile, params);
  }

  /**
   * Check if a file exists in the data directory
   * @param filename - Name of the file
   * @returns True if file exists
   */
  fileExists(filename: string): boolean {
    const filePath = this.getDataPath(filename);
    return fs.existsSync(filePath);
  }

  /**
   * Delete a file from the data directory
   * @param filename - Name of the file to delete
   * @returns Success status
   */
  deleteFile(filename: string): boolean {
    try {
      const filePath = this.getDataPath(filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.info(`Successfully deleted ${filename}`);
        return true;
      }
      logger.warn(`File ${filename} doesn't exist, cannot delete`);
      return false;
    } catch (error) {
      logger.error(
        `Error deleting ${filename}:`,
        error instanceof Error ? error : new Error(String(error))
      );
      return false;
    }
  }

  /**
   * Get file stats
   * @param filename - Name of the file
   * @returns File stats or null if file doesn't exist
   */
  getFileStats(filename: string): fs.Stats | null {
    try {
      const filePath = this.getDataPath(filename);
      if (fs.existsSync(filePath)) {
        return fs.statSync(filePath);
      }
      return null;
    } catch (error) {
      logger.error(
        `Error getting stats for ${filename}:`,
        error instanceof Error ? error : new Error(String(error))
      );
      return null;
    }
  }

  /**
   * Backup a file by creating a copy with timestamp
   * @param filename - Name of the file to backup
   * @returns Success status
   */
  backupFile(filename: string): boolean {
    try {
      const filePath = this.getDataPath(filename);
      if (fs.existsSync(filePath)) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const backupFilename = `${filename}.backup.${timestamp}`;
        const backupPath = this.getDataPath(backupFilename);

        fs.copyFileSync(filePath, backupPath);
        logger.info(`Successfully backed up ${filename} to ${backupFilename}`);
        return true;
      }
      logger.warn(`File ${filename} doesn't exist, cannot backup`);
      return false;
    } catch (error) {
      logger.error(
        `Error backing up ${filename}:`,
        error instanceof Error ? error : new Error(String(error))
      );
      return false;
    }
  }
}

// Create and export singleton instance
const fileService = new FileService();
export default fileService;