"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useRef, useState } from "react";

interface MessageInputProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly onSend: () => void;
  readonly onCameraClick: () => void;
  readonly onGalleryClick: () => void;
  readonly onBatteryClick: () => void;
  readonly onLocationClick: () => void;
  readonly disabled?: boolean;
}

export function MessageInput({
  value,
  onChange,
  onSend,
  onCameraClick,
  onGalleryClick,
  onBatteryClick,
  onLocationClick,
  disabled = false,
}: MessageInputProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSend();
    }
  };

  // Fermer le menu quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleCameraClick = () => {
    setIsMenuOpen(false);
    onCameraClick();
  };

  const handleGalleryClick = () => {
    setIsMenuOpen(false);
    onGalleryClick();
  };

  const handleBatteryClick = () => {
    setIsMenuOpen(false);
    onBatteryClick();
  };

  const handleLocationClick = () => {
    setIsMenuOpen(false);
    onLocationClick();
  };

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      <div className="flex space-x-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Tapez votre message..."
          onKeyDown={handleKeyDown}
          className="flex-1"
        />
        <div className="relative" ref={menuRef}>
          <Button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            variant="outline"
            size="icon"
            title="Ajouter une photo"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 5V19M5 12H19"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Button>
          {isMenuOpen && (
            <div className="absolute bottom-full right-0 mb-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <button
                onClick={handleCameraClick}
                className="w-full px-4 py-3 text-left hover:bg-gray-100 flex items-center space-x-3 rounded-t-lg transition-colors"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-gray-600"
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
                <span className="text-gray-700">Prendre une photo</span>
              </button>
              <button
                onClick={handleGalleryClick}
                className="w-full px-4 py-3 text-left hover:bg-gray-100 flex items-center space-x-3 transition-colors"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-gray-600"
                >
                  <path
                    d="M4 16L8.586 11.414C9.367 10.633 10.633 10.633 11.414 11.414L16 16M14 14L15.586 12.414C16.367 11.633 17.633 11.633 18.414 12.414L22 16M2 20H22C23.1046 20 24 19.1046 24 18V6C24 4.89543 23.1046 4 22 4H2C0.89543 4 0 4.89543 0 6V18C0 19.1046 0.89543 20 2 20Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-gray-700">Envoyer depuis la galerie</span>
              </button>
              <button
                onClick={handleBatteryClick}
                className="w-full px-4 py-3 text-left hover:bg-gray-100 flex items-center space-x-3 transition-colors"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-gray-600"
                >
                  <rect
                    x="1"
                    y="6"
                    width="18"
                    height="12"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <line
                    x1="23"
                    y1="10"
                    x2="23"
                    y2="14"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-gray-700">Envoyer la batterie</span>
              </button>
              <button
                onClick={handleLocationClick}
                className="w-full px-4 py-3 text-left hover:bg-gray-100 flex items-center space-x-3 rounded-b-lg transition-colors"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-gray-600"
                >
                  <path
                    d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle
                    cx="12"
                    cy="10"
                    r="3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-gray-700">Envoyer ma position</span>
              </button>
            </div>
          )}
        </div>
        <Button onClick={onSend} disabled={disabled || !value.trim()}>
          Envoyer
        </Button>
      </div>
    </div>
  );
}
