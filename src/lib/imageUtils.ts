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
export function base64ToDataUrl(
  base64: string,
  mimeType = "image/jpeg",
): string {
  return `data:${mimeType};base64,${base64}`;
}

/**
 * Vérifie si une chaîne est une URL d'image (http/https)
 */
export function isImageUrl(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://");
}

/**
 * Vérifie si une chaîne est probablement du base64 d'image
 * (pas juste du texte qui pourrait ressembler à du base64)
 */
export function isBase64Image(content: string): boolean {
  // Un base64 d'image est généralement long (au moins 100 caractères)
  if (content.length < 100) {
    return false;
  }

  // Vérifier que ce n'est pas une URL
  if (isImageUrl(content) || content.startsWith("data:image")) {
    return false;
  }

  // Vérifier que ce n'est pas du texte normal (contient des espaces, retours à la ligne, etc.)
  if (/\s/.test(content)) {
    return false;
  }

  // Vérifier que la chaîne contient principalement des caractères base64 valides
  // Base64 utilise A-Z, a-z, 0-9, +, /, et = pour le padding
  const base64Regex = /^[A-Za-z0-9+/=]+$/;
  if (!base64Regex.test(content)) {
    return false;
  }

  // Si la longueur est significative et que c'est du base64 valide, c'est probablement une image
  return true;
}

/**
 * Vérifie si le contenu d'un message est une image
 * (data URL, base64 pur, ou URL d'image)
 */
export function isImageContent(content: string): boolean {
  if (!content || typeof content !== "string") {
    return false;
  }

  // Vérifier si c'est un data URL d'image
  if (isValidImageDataUrl(content)) {
    return true;
  }

  // Vérifier si c'est une URL d'image HTTP/HTTPS
  if (isImageUrl(content)) {
    return true;
  }

  // Vérifier si c'est du base64 pur d'image
  if (isBase64Image(content)) {
    return true;
  }

  return false;
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
