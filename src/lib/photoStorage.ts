import type { PhotoData } from "@/types";
import { logger } from "./logger";

const STORAGE_KEY = "galleryPhotos";

export function savePhoto(photo: PhotoData): void {
  const savedPhotos = localStorage.getItem(STORAGE_KEY);
  const photos = savedPhotos ? JSON.parse(savedPhotos) : [];
  photos.push(photo);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(photos));
  window.dispatchEvent(new Event("galleryUpdated"));
}

export function loadPhotos(): PhotoData[] {
  try {
    const savedPhotos = localStorage.getItem(STORAGE_KEY);
    if (!savedPhotos) {
      return [];
    }

    const parsedPhotos = JSON.parse(savedPhotos);

    // Filtrer les photos valides
    const validPhotos = parsedPhotos.filter((photo: PhotoData) => {
      if (!photo.imageUrl) {
        return false;
      }
      return photo.imageUrl.startsWith("data:image");
    });

    // Trier par date (plus récentes en premier)
    return validPhotos.sort(
      (a: PhotoData, b: PhotoData) =>
        new Date(b.dateEmis).getTime() - new Date(a.dateEmis).getTime(),
    );
  } catch (error) {
    logger.error("Erreur lors du chargement des photos:", error);
    return [];
  }
}

export function deletePhoto(id: string): PhotoData[] {
  const photos = loadPhotos();
  const updatedPhotos = photos.filter((photo) => photo.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPhotos));
  window.dispatchEvent(new Event("galleryUpdated"));
  return updatedPhotos;
}
