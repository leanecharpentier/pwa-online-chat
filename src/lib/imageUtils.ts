/**
 * Utilitaires pour la gestion des images
 */

/**
 * Vérifie si une chaîne est un data URL d'image valide
 */
export function isValidImageDataUrl(dataUrl: string): boolean {
  return dataUrl.startsWith("data:image");
}

/**
 * Extrait les données base64 d'un data URL
 */
export function extractBase64FromDataUrl(dataUrl: string): string {
  const base64Data = dataUrl.split(",")[1];
  if (!base64Data) {
    throw new Error(
      "Format d'image invalide: impossible d'extraire les données base64",
    );
  }
  return base64Data;
}

/**
 * Convertit du base64 en data URL
 */
export function base64ToDataUrl(base64: string, mimeType = "image/jpeg"): string {
  return `data:${mimeType};base64,${base64}`;
}

/**
 * Vérifie si une chaîne est une URL d'image (http/https)
 */
export function isImageUrl(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://");
}

/**
 * Normalise une image reçue du serveur
 * Peut être une URL, un data URL, ou du base64
 */
export function normalizeImageContent(content: string): string {
  if (isImageUrl(content)) {
    return content;
  }
  if (content.startsWith("data:image")) {
    return content;
  }
  // Sinon, c'est du base64, on le convertit en data URL
  return base64ToDataUrl(content);
}

