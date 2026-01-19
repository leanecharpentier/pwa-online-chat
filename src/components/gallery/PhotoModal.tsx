import { formatTime } from "@/lib/utils";
import type { PhotoData } from "@/types";

interface PhotoModalProps {
  photo: PhotoData;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export function PhotoModal({ photo, onClose, onDelete }: PhotoModalProps) {
  const handleDelete = () => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette photo ?")) {
      onDelete(photo.id);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-opacity-90 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-full"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-white/90 hover:bg-white rounded-full p-2 transition-colors"
          aria-label="Fermer"
        >
          <svg
            className="w-6 h-6 text-gray-800"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        <img
          src={photo.imageUrl}
          alt={`Photo du ${formatTime(photo.dateEmis)}`}
          className="max-w-full max-h-[90vh] rounded-lg bg-white"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 rounded-b-lg">
          <div className="flex items-center justify-between text-white">
            <div>
              <p className="font-semibold">{photo.pseudo}</p>
              <p className="text-sm text-gray-300">
                {formatTime(photo.dateEmis)}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {decodeURIComponent(photo.roomName)}
              </p>
            </div>
            <button
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
