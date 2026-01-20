import { useEffect, useRef, useState } from "react";
import { logger } from "@/lib/logger";
import { showError } from "@/lib/errors";

export function useCamera(isOpen: boolean) {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraLoading, setCameraLoading] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialiser la caméra quand la modal s'ouvre
  useEffect(() => {
    if (!isOpen) {
      // Nettoyer si la modal se ferme
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
      return;
    }

    let stream: MediaStream | null = null;
    let cancelled = false;

    const initCamera = async () => {
      setCameraLoading(true);
      try {
        // Attendre que l'élément vidéo soit monté (jusqu'à 2 secondes)
        let attempts = 0;
        while (!videoRef.current && attempts < 20) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          attempts++;
        }

        if (!videoRef.current) {
          throw new Error("Élément vidéo non disponible");
        }

        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        // Assigner le stream à l'élément vidéo
        const videoEl = videoRef.current;
        if (videoEl && !cancelled) {
          videoEl.srcObject = stream;

          // Forcer la lecture
          try {
            await videoEl.play();
          } catch (playError) {
            logger.error("Erreur lors de la lecture:", playError);
          }
        } else {
          stream.getTracks().forEach((track) => track.stop());
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        logger.error("Erreur d'accès à la caméra:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Erreur inconnue";
        showError("CAMERA_ACCESS_ERROR", `Impossible d'accéder à la caméra: ${errorMessage}`);
        setCameraLoading(false);
      }
    };

    // Démarrer l'initialisation après un délai pour laisser le DOM se mettre à jour
    const timeoutId = setTimeout(() => {
      initCamera();
    }, 200);

    // Nettoyage au démontage
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (videoRef.current?.srcObject) {
        const currentStream = videoRef.current.srcObject as MediaStream;
        currentStream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
    };
  }, [isOpen]);

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCapturedImage(null);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      // Vérifier que la vidéo est prête
      if (video.readyState < 2) {
        alert("Veuillez attendre que la vidéo soit prête");
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      if (context) {
        // S'assurer que le canvas a un fond blanc
        context.fillStyle = "#FFFFFF";
        context.fillRect(0, 0, canvas.width, canvas.height);

        // Dessiner l'image de la vidéo
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Vérifier que l'image n'est pas vide/noire
        const imageData = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        );
        const data = imageData.data;
        let hasContent = false;

        // Vérifier quelques pixels pour voir s'il y a du contenu
        for (let i = 0; i < data.length; i += 16) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          // Si ce n'est pas noir ou blanc pur, il y a du contenu
          if (
            !(r === 0 && g === 0 && b === 0) &&
            !(r === 255 && g === 255 && b === 255)
          ) {
            hasContent = true;
            break;
          }
        }

        if (!hasContent) {
          logger.warn("L'image capturée semble être vide ou noire");
        }

        const imageDataUrl = canvas.toDataURL("image/jpeg", 0.8);
        setCapturedImage(imageDataUrl);
      }
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
  };

  return {
    videoRef,
    canvasRef,
    capturedImage,
    cameraLoading,
    setCameraLoading,
    capturePhoto,
    stopCamera,
    retakePhoto,
  };
}
