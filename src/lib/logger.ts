/**
 * Système de logging centralisé
 * En production, les logs peuvent être envoyés à un service externe
 */

type LogLevel = "error" | "warn" | "info" | "debug";

const isDevelopment = process.env.NODE_ENV === "development";

export const logger = {
  error: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.error(`[ERROR] ${message}`, ...args);
    }
    // En production, envoyer à un service de logging
  },

  warn: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },

  info: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.log(`[INFO] ${message}`, ...args);
    }
  },

  debug: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  },
};

