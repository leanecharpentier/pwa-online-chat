import { PhotoGridItem } from "./PhotoGridItem";
import type { PhotoData } from "@/types";

interface PhotoGalleryProps {
  photos: PhotoData[];
  onPhotoSelect: (photo: PhotoData) => void;
}

export function PhotoGallery({ photos, onPhotoSelect }: PhotoGalleryProps) {
  if (photos.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📷</div>
          <p className="text-gray-500 text-lg">Aucune photo sauvegardée</p>
          <p className="text-gray-400 text-sm mt-2">
            Prenez une photo dans le chat pour quelle apparaisse ici
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {photos.map((photo) => (
          <PhotoGridItem
            key={photo.id}
            photo={photo}
            onSelect={onPhotoSelect}
          />
        ))}
      </div>
    </div>
  );
}
