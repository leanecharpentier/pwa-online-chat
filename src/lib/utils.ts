import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { logger } from "./logger";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(dateString: string): string {
  try {
    const date = new Date(dateString);

    // Vérifier si la date est valide
    if (isNaN(date.getTime())) {
      return "Invalid date";
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    // Si c'est aujourd'hui, afficher l'heure
    if (diffHours < 24 && date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    // Si c'est hier
    else if (diffDays < 2 && diffDays >= 1) {
      return (
        "Hier " +
        date.toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    }
    // Si c'est cette semaine
    else if (diffDays < 7) {
      return date.toLocaleDateString("fr-FR", {
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    // Sinon, afficher la date complète
    else {
      return date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    }
  } catch (error) {
    logger.error("Erreur lors du formatage de la date:", error);
    return "Date invalide";
  }
}
