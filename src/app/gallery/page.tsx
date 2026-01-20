"use client";

import { CameraModal } from "@/components/CameraModal";
import { PhotoGallery } from "@/components/gallery/PhotoGallery";
import { PhotoModal } from "@/components/gallery/PhotoModal";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { usePhotoStorage } from "@/hooks/usePhotoStorage";
import { isValidImageDataUrl } from "@/lib/imageUtils";
import { showError } from "@/lib/errors";
import type { PhotoData } from "@/types";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function GalleryPage() {
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoData | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const { photos, loading, save, remove } = usePhotoStorage();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/connexion");
    }
  }, [isAuthenticated, router]);

  const handlePhotoCapture = (imageDataUrl: string) => {
    if (!isValidImageDataUrl(imageDataUrl)) {
      showError("INVALID_IMAGE_FORMAT");
      return;
    }

    const photoData: PhotoData = {
      id: Date.now().toString(),
      imageUrl: imageDataUrl,
      dateEmis: new Date().toISOString(),
      roomName: "Galerie",
      pseudo: user?.username || "Utilisateur",
    };

    try {
      save(photoData);
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("Erreur lors de la sauvegarde de la photo");
      }
    }
  };

  const handleDeletePhoto = (id: string) => {
    remove(id);
    if (selectedPhoto?.id === id) {
      setSelectedPhoto(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="h-full flex items-center justify-center">
        <p>Redirection vers la page de connexion...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">
            Chargement de la galerie...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              📸 Galerie de photos
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {photos.length} photo{photos.length > 1 ? "s" : ""} sauvegardée
              {photos.length > 1 ? "s" : ""}
            </p>
          </div>
          <Button
            onClick={() => setIsCameraOpen(true)}
            className="bg-blue-500 hover:bg-blue-600"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="mr-2"
            >
              <path
                d="M9 3H15L17 5H21C21.5304 5 22.0391 5.21071 22.4142 5.58579C22.7893 5.96086 23 6.46957 23 7V19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V7C1 6.46957 1.21071 5.96086 1.58579 5.58579C1.96086 5.21071 2.46957 5 3 5H7L9 3Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx="12"
                cy="13"
                r="4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Prendre une photo
          </Button>
        </div>
      </div>

      <PhotoGallery photos={photos} onPhotoSelect={setSelectedPhoto} />

      {selectedPhoto && (
        <PhotoModal
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
          onDelete={handleDeletePhoto}
        />
      )}

      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handlePhotoCapture}
        actionLabel="Sauvegarder"
        actionIcon="💾"
      />
    </div>
  );
}
