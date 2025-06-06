// Configuration optionnelle pour étendre Winston avec des types personnalisés
import winston from "winston";

// Étendre Winston avec des niveaux de log personnalisés si nécessaire
export interface CustomLogger extends winston.Logger {
  // Ajouter des méthodes personnalisées si besoin
  request?(message: string, meta?: winston.LogEntry): winston.Logger;
  response?(message: string, meta?: winston.LogEntry): winston.Logger;
}

// Types pour les métadonnées de log spécifiques à l'application
export interface RequestLogMeta {
  method: string;
  url: string;
  ip: string;
  userAgent?: string;
  sessionId?: string;
}

export interface ErrorLogMeta {
  stack?: string;
  code?: string;
  statusCode?: number;
}

export interface ServerLogMeta {
  host: string;
  port: number;
  environment: string;
  url: string;
}

// Types pour Winston transports personnalisés
export interface FileTransportOptions
  extends winston.transports.FileTransportOptions {
  filename: string;
  maxsize?: number;
  maxFiles?: number;
  datePattern?: string;
}

export {};
