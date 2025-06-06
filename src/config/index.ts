import dotenv from 'dotenv';
import path from 'path';

// Charger les variables d'environnement
dotenv.config();

interface Config {
  // Serveur
  port: number;
  ipAddress: string;
  nodeEnv: string;
  
  // Authentification
  auth: {
    username: string;
    password: string;
    sessionSecret: string;
    sessionMaxAge: number;
  };
  
  // Modèles et LLaMA
  llamaCppPath: string;
  modelPath: string;
  modelsDir: string;
  
  // Configuration LLaMA (pour compatibilité avec llamaService)
  llama: {
    path: string;
    model: string;
    cppPath: string;     // Ajout pour llamaService
    modelPath: string;   // Ajout pour llamaService
  };
  
  // Data directories
  data: {
    dir: string;
    prepromptsFile: string;
    modelParamsFile: string;
  };
  
  // CORS
  cors: {
    origin: () => string | string[];
    credentials: boolean;
  };
  
  // Logging
  logging: {
    level: string;
    file: string;
  };
}

const config: Config = {
  // Configuration serveur
  port: parseInt(process.env.PORT || '3000', 10),
  ipAddress: process.env.IP_ADDRESS || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Authentification
  auth: {
    username: process.env.AUTH_USERNAME || 'admin',
    password: process.env.AUTH_PASSWORD || 'password123',
    sessionSecret: process.env.SESSION_SECRET || 'changez_cette_cle_par_une_cle_aleatoire_tres_longue_et_securisee',
    sessionMaxAge: 24 * 60 * 60 * 1000 // 24 heures
  },
  
  // Chemins modèles
  llamaCppPath: process.env.LLAMA_CPP_PATH || '/usr/local/bin/llama-cli',
  modelPath: process.env.MODEL_PATH || path.join(process.cwd(), 'models', 'default.gguf'),
  modelsDir: path.join(process.cwd(), 'models'),
  
  // Configuration LLaMA (pour compatibilité avec llamaService)
  llama: {
    path: process.env.LLAMA_CPP_PATH || '/usr/local/bin/llama-cli',
    model: process.env.MODEL_PATH || path.join(process.cwd(), 'models', 'default.gguf'),
    cppPath: process.env.LLAMA_CPP_PATH || '/usr/local/bin/llama-cli',
    modelPath: process.env.MODEL_PATH || path.join(process.cwd(), 'models', 'default.gguf')
  },
  
  // Data directories
  data: {
    dir: path.join(process.cwd(), 'data'),
    prepromptsFile: 'preprompts.json',
    modelParamsFile: 'modelParams.json'
  },
  
  // CORS
  cors: {
    origin: () => {
      if (config.nodeEnv === 'development') {
        return ['http://localhost:3000', 'http://127.0.0.1:3000'];
      }
      return process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'];
    },
    credentials: true
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || './logs/app.log'
  }
};

// Validation de base
if (!config.auth.username || !config.auth.password) {
  console.warn('⚠️  Attention: Utilisez des identifiants sécurisés en production!');
}

if (config.auth.sessionSecret.includes('changez_cette_cle')) {
  console.warn('⚠️  Attention: Changez SESSION_SECRET en production!');
}

export default config;
