import { useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import { useOffline } from "./useOffline";
import API from "@/lib/api";
import { savePhoto, loadPhotos } from "@/lib/photoStorage";
import { logger } from "@/lib/logger";
import {
  isValidImageDataUrl,
  extractBase64FromDataUrl,
} from "@/lib/imageUtils";
import { showError, ErrorMessages } from "@/lib/errors";
import type { Message } from "@/types";

interface UsePhotoCaptureOptions {
  selectedRoomName: string;
  isOnline: boolean;
  onMessageAdded: (message: Message) => void;
}

export function usePhotoCapture({
  selectedRoomName,
  isOnline,
  onMessageAdded,
}: UsePhotoCaptureOptions) {
  const { user } = useAuth();
  const socket = useSocket();
  const { addPendingMessage } = useOffline();

  const handlePhotoCapture = useCallback(
    async (imageDataUrl: string) => {
      if (!isValidImageDataUrl(imageDataUrl)) {
        showError("INVALID_IMAGE_FORMAT");
        return;
      }

      if (!selectedRoomName) {
        showError("NO_ROOM_SELECTED");
        return;
      }

      if (!socket.socket) {
        showError("SOCKET_NOT_INITIALIZED");
        return;
      }

      // Attendre la connexion du socket si nécessaire
      if (!socket.socket.connected) {
        try {
          await new Promise<void>((resolve, reject) => {
            if (!socket.socket) {
              reject(new Error("Socket non initialisé"));
              return;
            }

            const timeout = setTimeout(() => {
              reject(new Error("Timeout: le socket ne s'est pas connecté"));
            }, 5000);

            if (socket.socket.connected) {
              clearTimeout(timeout);
              resolve();
              return;
            }

            socket.socket.once("connect", () => {
              clearTimeout(timeout);
              resolve();
            });

            socket.socket.once("connect_error", (error) => {
              clearTimeout(timeout);
              reject(error);
            });
          });
        } catch (error) {
          logger.error("Erreur de connexion socket:", error);
          showError("SOCKET_CONNECTION_TIMEOUT");
          return;
        }
      }

      if (!socket.socket.id) {
        showError("SOCKET_ID_UNAVAILABLE");
        return;
      }

      // S'assurer que la salle est jointe
      if (socket.currentRoomName !== selectedRoomName) {
        socket.joinRoom(selectedRoomName);
      }

      // Essayer d'envoyer l'image à l'API (optionnel)
      try {
        await API.postImage(imageDataUrl, socket.socket.id);
      } catch (error) {
        // On continue même si l'API échoue (CORS possible)
      }

      const pseudo = user?.username || "Utilisateur";

      // Extraire le base64 pour vérifier si l'image existe déjà
      const base64Data = extractBase64FromDataUrl(imageDataUrl);

      // Vérifier si l'image existe déjà dans le localStorage
      const existingPhotos = loadPhotos();
      const imageAlreadyExists = existingPhotos.some((photo) => {
        if (!photo.imageUrl) return false;
        try {
          const photoBase64 = photo.imageUrl.startsWith("data:image")
            ? extractBase64FromDataUrl(photo.imageUrl)
            : photo.imageUrl;
          // Comparer les premiers caractères du base64 pour détecter les doublons
          return photoBase64.substring(0, 100) === base64Data.substring(0, 100);
        } catch {
          return false;
        }
      });

      // Sauvegarder la photo dans localStorage seulement si elle n'existe pas déjà
      if (!imageAlreadyExists) {
        const photoData = {
          id: Date.now().toString(),
          imageUrl: imageDataUrl,
          dateEmis: new Date().toISOString(),
          roomName: selectedRoomName,
          pseudo,
        };

        try {
          savePhoto(photoData);
        } catch (error) {
          logger.error("Erreur lors de la sauvegarde:", error);
          if (error instanceof Error && error.name === "QuotaExceededError") {
            showError("STORAGE_QUOTA_EXCEEDED");
          } else {
            showError("SAVE_ERROR");
          }
          return;
        }
      }

      // Le base64 a déjà été extrait ci-dessus pour la vérification

      // Créer un message local pour afficher l'image immédiatement
      // On utilise un tempId même en ligne pour pouvoir matcher avec le message du serveur
      const tempId = `photo-${Date.now()}-${Math.random()}`;
      const photoMessage: Message = {
        content: base64Data,
        categorie: "NEW_IMAGE",
        dateEmis: new Date().toISOString(),
        roomName: selectedRoomName,
        pseudo,
        userId: socket.socket.id,
        imageUrl: imageDataUrl,
        imageId: socket.socket.id,
        tempId,
        isPending: true, // Marqué comme en attente jusqu'à réception du serveur
      };

      // Vérifier si on est en ligne
      if (isOnline && socket.socket?.connected) {
        onMessageAdded(photoMessage);
        if (socket.socket?.id) {
          socket.sendImage(imageDataUrl, socket.socket.id);
        }
      } else {
        // Hors ligne : stocker dans localStorage
        const pendingMessage = addPendingMessage({
          ...photoMessage,
          content: imageDataUrl,
        });
        onMessageAdded(pendingMessage);
      }
    },
    [
      selectedRoomName,
      socket,
      user,
      isOnline,
      addPendingMessage,
      onMessageAdded,
    ],
  );

  return { handlePhotoCapture };
}
