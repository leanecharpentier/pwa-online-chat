"use client";

import { Button } from "@/components/ui/button";
import { useCamera } from "@/hooks/useCamera";
import { logger } from "@/lib/logger";
import { showError } from "@/lib/errors";

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageDataUrl: string) => void;
  actionLabel?: string;
  actionIcon?: string;
}

export function CameraModal({
  isOpen,
  onClose,
  onCapture,
  actionLabel = "Envoyer",
  actionIcon = "📤",
}: CameraModalProps) {
  const {
    videoRef,
    canvasRef,
    capturedImage,
    cameraLoading,
    setCameraLoading,
    capturePhoto,
    stopCamera,
    retakePhoto,
  } = useCamera(isOpen);

  if (!isOpen) return null;

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  const handleAction = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      handleClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-4 max-w-md w-full mx-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-4 text-white">
            {capturedImage
              ? "Photo capturée"
              : cameraLoading
                ? "Initialisation de la caméra..."
                : "Prendre une photo"}
          </h3>

          {!capturedImage && (
            <div className="relative">
              {cameraLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-lg z-10">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <span className="ml-2 text-white">
                      Chargement de la caméra...
                    </span>
                  </div>
                </div>
              )}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full rounded-lg bg-gray-100"
                style={{ minHeight: "200px" }}
                onLoadedMetadata={() => {
                  setCameraLoading(false);
                }}
                onCanPlay={() => {
                  setCameraLoading(false);
                }}
                onPlaying={() => {
                  setCameraLoading(false);
                }}
                onError={(e) => {
                  logger.error("Erreur vidéo:", e);
                  setCameraLoading(false);
                  showError("VIDEO_LOAD_ERROR");
                }}
              />
              <canvas ref={canvasRef} className="hidden" />
              <div className="flex justify-center space-x-2 mt-4">
                <Button
                  onClick={capturePhoto}
                  className="bg-blue-500 hover:bg-blue-600"
                  disabled={cameraLoading}
                >
                  📸 Capturer
                </Button>
                <Button onClick={handleClose} variant="outline">
                  Annuler
                </Button>
              </div>
            </div>
          )}

          {capturedImage && (
            <div>
              <div className="relative">
                <img
                  src={capturedImage}
                  alt="Aperçu"
                  className="w-full rounded-lg"
                />
              </div>
              <div className="flex justify-center space-x-2 mt-4">
                <Button
                  onClick={handleAction}
                  className="bg-green-500 hover:bg-green-600"
                >
                  {actionIcon} {actionLabel}
                </Button>
                <Button onClick={retakePhoto} variant="outline">
                  🔄 Reprendre
                </Button>
                <Button onClick={handleClose} variant="outline">
                  Annuler
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
