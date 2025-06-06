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
  };
  
  // Modèles et LLaMA
  llamaCppPath: string;
  modelPath: string;
  modelsDir: string;
  
  // Session
  session: {
    secret: string;
    maxAge: number;
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
    password: process.env.AUTH_PASSWORD || 'password123'
  },
  
  // Chemins modèles
  llamaCppPath: process.env.LLAMA_CPP_PATH || '/usr/local/bin/llama-cli',
  modelPath: process.env.MODEL_PATH || path.join(process.cwd(), 'models', 'default.gguf'),
  modelsDir: path.join(process.cwd(), 'models'),
  
  // Session
  session: {
    secret: process.env.SESSION_SECRET || 'changez_cette_cle_par_une_cle_aleatoire_tres_longue_et_securisee',
    maxAge: 24 * 60 * 60 * 1000 // 24 heures
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

if (config.session.secret.includes('changez_cette_cle')) {
  console.warn('⚠️  Attention: Changez SESSION_SECRET en production!');
}

export default config;