"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePhotoStorage } from "@/hooks/usePhotoStorage";
import type { PhotoData } from "@/types";
import { useEffect, useState } from "react";

interface GallerySelectorProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSelect: (imageDataUrl: string) => void;
}

export function GallerySelector({
  isOpen,
  onClose,
  onSelect,
}: GallerySelectorProps) {
  const { photos, loading } = usePhotoStorage();
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoData | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedPhoto(null);
    }
  }, [isOpen]);

  const handleSelect = () => {
    if (selectedPhoto?.imageUrl) {
      onSelect(selectedPhoto.imageUrl);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Sélectionner une photo depuis la galerie</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Chargement...</p>
              </div>
            </div>
          )}
          {!loading && photos.length === 0 && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="text-6xl mb-4">📷</div>
                <p className="text-gray-500 text-lg">Aucune photo dans la galerie</p>
                <p className="text-gray-400 text-sm mt-2">
                  Prenez une photo pour qu'elle apparaisse ici
                </p>
              </div>
            </div>
          )}
          {!loading && photos.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-4">
              {photos.map((photo) => {
                const isSelected = selectedPhoto?.id === photo.id;
                return (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => setSelectedPhoto(photo)}
                    className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                      isSelected
                        ? "border-blue-500 ring-2 ring-blue-200"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <img
                      src={photo.imageUrl}
                      alt=""
                      className="w-full h-32 object-cover"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                        <div className="bg-blue-500 text-white rounded-full p-2">
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M20 6L9 17L4 12"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            onClick={handleSelect}
            disabled={!selectedPhoto}
            className="bg-blue-500 hover:bg-blue-600"
          >
            Envoyer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
