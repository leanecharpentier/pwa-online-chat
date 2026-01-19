import { formatTime } from "@/lib/utils";
import type { PhotoData } from "@/types";
import { useState } from "react";

interface PhotoGridItemProps {
  photo: PhotoData;
  onSelect: (photo: PhotoData) => void;
}

export function PhotoGridItem({ photo, onSelect }: PhotoGridItemProps) {
  const [hasError, setHasError] = useState(false);

  return (
    <div
      className="relative group cursor-pointer"
      onClick={() => onSelect(photo)}
    >
      <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200 hover:border-blue-500 transition-colors relative">
        {hasError ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <div className="text-center p-4">
              <svg
                className="w-12 h-12 text-gray-400 mx-auto mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-xs text-gray-500">Image corrompue</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setHasError(false);
                }}
                className="mt-2 text-xs text-blue-500 hover:text-blue-700"
              >
                Réessayer
              </button>
            </div>
          </div>
        ) : (
          <img
            src={photo.imageUrl}
            alt={`Photo du ${formatTime(photo.dateEmis)}`}
            className="w-full h-full object-cover"
            onError={() => setHasError(true)}
            onLoad={() => setHasError(false)}
          />
        )}
        {/* Overlay au survol */}
        <div className="absolute inset-0 bg-opacity-0 group-hover:bg-opacity-30 transition-opacity rounded-lg flex items-center justify-center pointer-events-none z-10">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM15 10a5 5 0 11-10 0 5 5 0 0110 0z"
              />
            </svg>
          </div>
        </div>
        {/* Date au survol */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
          <p className="text-white text-xs truncate">
            {formatTime(photo.dateEmis)}
          </p>
        </div>
      </div>
    </div>
  );
}
