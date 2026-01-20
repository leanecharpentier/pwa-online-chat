/**
 * Messages d'erreur centralisés pour une meilleure cohérence
 */

export const ErrorMessages = {
  SOCKET_NOT_INITIALIZED: "Erreur: socket non initialisé. Veuillez rafraîchir la page.",
  SOCKET_NOT_CONNECTED: "Erreur: socket non connecté. Veuillez attendre la connexion.",
  SOCKET_ID_UNAVAILABLE: "Erreur: socket ID non disponible. Veuillez réessayer.",
  SOCKET_CONNECTION_TIMEOUT: "Erreur: impossible de se connecter au serveur. Veuillez réessayer.",
  NO_ROOM_SELECTED: "Erreur: aucune salle sélectionnée",
  INVALID_IMAGE_FORMAT: "Erreur: format d'image invalide",
  STORAGE_QUOTA_EXCEEDED: "Erreur: L'espace de stockage est plein. Veuillez supprimer des photos.",
  SAVE_ERROR: "Erreur lors de la sauvegarde de la photo",
  BATTERY_NOT_SUPPORTED: "Erreur: impossible d'accéder aux informations de batterie. Cette fonctionnalité n'est peut-être pas supportée par votre navigateur.",
  GEOLOCATION_NOT_SUPPORTED: "Erreur: la géolocalisation n'est pas supportée par votre navigateur.",
  GEOLOCATION_PERMISSION_DENIED: "Erreur: permission de géolocalisation refusée. Veuillez autoriser l'accès à votre position.",
  GEOLOCATION_UNAVAILABLE: "Erreur: position indisponible. Vérifiez que votre GPS est activé.",
  GEOLOCATION_TIMEOUT: "Erreur: timeout lors de la récupération de la position. Veuillez réessayer.",
  GEOLOCATION_ERROR: "Erreur: impossible d'obtenir votre position.",
  CAMERA_ACCESS_ERROR: "Impossible d'accéder à la caméra",
  VIDEO_LOAD_ERROR: "Erreur lors du chargement de la vidéo",
} as const;

export type ErrorMessageKey = keyof typeof ErrorMessages;

/**
 * Affiche un message d'erreur à l'utilisateur
 */
export function showError(key: ErrorMessageKey, customMessage?: string): void {
  const message = customMessage || ErrorMessages[key];
  alert(message);
}

