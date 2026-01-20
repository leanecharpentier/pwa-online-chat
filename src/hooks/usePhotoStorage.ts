import { useEffect, useState } from "react";
import { deletePhoto, loadPhotos, savePhoto } from "@/lib/photoStorage";
import { logger } from "@/lib/logger";
import type { PhotoData } from "@/types";

export function usePhotoStorage() {
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const load = () => {
    setLoading(true);
    const loadedPhotos = loadPhotos();
    setPhotos(loadedPhotos);
    setLoading(false);
  };

  const save = (photo: PhotoData) => {
    try {
      savePhoto(photo);
      load();
    } catch (error) {
      logger.error("Erreur lors de la sauvegarde:", error);
      if (error instanceof Error && error.name === "QuotaExceededError") {
        throw new Error(
          "Erreur: L'espace de stockage est plein. Veuillez supprimer des photos.",
        );
      }
      throw new Error("Erreur lors de la sauvegarde de la photo");
    }
  };

  const remove = (id: string) => {
    const updatedPhotos = deletePhoto(id);
    setPhotos(updatedPhotos);
  };

  useEffect(() => {
    load();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "galleryPhotos") {
        load();
      }
    };

    const handleCustomStorage = () => {
      load();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("galleryUpdated", handleCustomStorage);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("galleryUpdated", handleCustomStorage);
    };
  }, []);

  return {
    photos,
    loading,
    save,
    remove,
    reload: load,
  };
}
