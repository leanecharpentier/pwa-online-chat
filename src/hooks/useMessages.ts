import type { Message } from "@/types";
import { useCallback, useEffect, useState } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { useOffline } from "./useOffline";
import { logger } from "@/lib/logger";
import {
  normalizeImageContent,
  isImageContent,
  extractBase64FromDataUrl,
} from "@/lib/imageUtils";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "./useNotifications";
import { useNotificationSettings } from "./useNotificationSettings";

interface UseMessagesOptions {
  selectedRoomName: string;
  isOnline: boolean;
}

export function useMessages({
  selectedRoomName,
  isOnline,
}: UseMessagesOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const socket = useSocket();
  const { user } = useAuth();
  const {
    getPendingMessages,
    addPendingMessage,
    removePendingMessage,
    markMessageAsSent,
  } = useOffline();
  const { sendNotification, permission } = useNotifications();
  const { isRoomNotificationEnabled } = useNotificationSettings();

  const createMessageKey = useCallback(
    (message: Message) =>
      `${message.dateEmis}-${message.pseudo || message.userId}-${message.content?.substring(0, 50)}`,
    [],
  );

  const isMessageDuplicate = useCallback(
    (newMessage: Message, existingMessages: Message[]) => {
      const newKey = createMessageKey(newMessage);
      return existingMessages.some((msg) => createMessageKey(msg) === newKey);
    },
    [createMessageKey],
  );

  // Charger les messages en attente pour la salle actuelle au chargement
  useEffect(() => {
    if (selectedRoomName) {
      const pending = getPendingMessages();
      const roomPending = pending.filter(
        (msg) => msg.roomName === selectedRoomName && msg.isPending,
      );
      if (roomPending.length > 0) {
        setMessages((prevMessages) => {
          const existingTempIds = new Set(
            prevMessages.map((m) => m.tempId).filter(Boolean),
          );
          const newPending = roomPending.filter(
            (msg) => !existingTempIds.has(msg.tempId),
          );
          return [...prevMessages, ...newPending];
        });
      }
    }
  }, [selectedRoomName, getPendingMessages]);

  // Envoyer automatiquement les messages en attente quand la connexion revient
  useEffect(() => {
    if (isOnline && socket.socket?.connected && selectedRoomName) {
      if (socket.currentRoomName !== selectedRoomName) {
        socket.joinRoom(selectedRoomName);
      }

      const sendPendingMessages = async () => {
        await new Promise((resolve) => setTimeout(resolve, 500));

        const pending = getPendingMessages();
        const roomPending = pending.filter(
          (msg) => msg.roomName === selectedRoomName && msg.isPending,
        );

        if (roomPending.length > 0) {
          for (const pendingMsg of roomPending) {
            try {
              if (pendingMsg.categorie === "NEW_IMAGE" && pendingMsg.imageUrl) {
                socket.sendImage(
                  pendingMsg.imageUrl,
                  pendingMsg.userId || socket.socket?.id || "",
                );
              } else {
                socket.sendMessage(pendingMsg.content);
              }

              markMessageAsSent(pendingMsg.tempId!);
              setMessages((prevMessages) =>
                prevMessages.map((msg) =>
                  msg.tempId === pendingMsg.tempId
                    ? { ...msg, isPending: false }
                    : msg,
                ),
              );
            } catch (error) {
              logger.error(
                "Erreur lors de l'envoi du message en attente:",
                error,
              );
            }
          }
        }
      };

      sendPendingMessages();
    }
  }, [
    isOnline,
    socket,
    selectedRoomName,
    getPendingMessages,
    markMessageAsSent,
  ]);

  // Écouter les nouveaux messages du socket
  useEffect(() => {
    if (!socket.socket) return;

    const handleNewMessage = async (data: Message) => {
      // Vérifier si c'est un message de l'utilisateur actuel
      const isOwnMessage =
        data.pseudo === user?.username || data.userId === socket.socket?.id;

      // Si le message n'est pas de la room sélectionnée, vérifier si on doit envoyer une notification
      if (data.roomName !== selectedRoomName) {
        // Envoyer une notification si :
        // 1. Les notifications sont activées pour cette room
        // 2. Ce n'est pas un message de l'utilisateur actuel
        // 3. Ce n'est pas un message du serveur
        // 4. La permission de notification est accordée
        if (
          !isOwnMessage &&
          data.pseudo !== "SERVER" &&
          permission === "granted" &&
          isRoomNotificationEnabled(data.roomName)
        ) {
          logger.info("Envoi de notification pour:", {
            room: data.roomName,
            pseudo: data.pseudo,
            content: data.content?.substring(0, 50),
          });
          sendNotification(data, data.roomName);
        } else {
          logger.debug("Notification non envoyée:", {
            isOwnMessage,
            pseudo: data.pseudo,
            permission,
            enabled: isRoomNotificationEnabled(data.roomName),
          });
        }
        return;
      }

      // Traitement des images
      // Vérifier si le contenu est une image (data URL, base64, ou URL) même si la catégorie n'est pas NEW_IMAGE
      if (
        data.content &&
        (data.categorie === "NEW_IMAGE" || isImageContent(data.content))
      ) {
        data.imageUrl = normalizeImageContent(data.content);

        if (data.userId && !data.pseudo) {
          data.pseudo = data.userId;
        }
      }

      setMessages((prevMessages) => {
        // Vérifier si c'est un message qui correspond à un message en attente
        // Pour les images, on compare aussi par imageUrl car le contenu peut être différent (base64 vs data URL)
        const isImageMessage =
          data.categorie === "NEW_IMAGE" || isImageContent(data.content || "");

        const matchingPending = prevMessages.find((msg) => {
          if (!msg.isPending || !msg.tempId) return false;
          if (msg.roomName !== data.roomName) return false;

          // Pour les messages d'images, comparer par imageUrl si disponible
          if (isImageMessage && msg.imageUrl && data.imageUrl) {
            // Normaliser les deux URLs pour comparer (extraire le base64 si nécessaire)
            try {
              const msgBase64 = msg.imageUrl.startsWith("data:image")
                ? extractBase64FromDataUrl(msg.imageUrl)
                : msg.imageUrl;
              const dataBase64 = data.imageUrl.startsWith("data:image")
                ? extractBase64FromDataUrl(data.imageUrl)
                : data.imageUrl;
              // Comparer les premiers caractères du base64 (plus rapide que toute la chaîne)
              if (
                msgBase64.substring(0, 100) === dataBase64.substring(0, 100)
              ) {
                return true;
              }
            } catch {
              // Si l'extraction échoue, continuer avec les autres méthodes
            }
          }

          // Comparer par contenu (pour les messages texte ou si imageUrl n'est pas disponible)
          if (msg.content === data.content) {
            return true;
          }

          // Pour les messages d'images de l'utilisateur, comparer par date et pseudo/userId
          if (isImageMessage && isOwnMessage) {
            const timeDiff = Math.abs(
              new Date(msg.dateEmis).getTime() -
                new Date(data.dateEmis).getTime(),
            );
            if (timeDiff < 5000) {
              return true;
            }
          }

          return false;
        });

        if (matchingPending && matchingPending.tempId) {
          const updated = prevMessages.map((msg) =>
            msg.tempId === matchingPending.tempId
              ? { ...data, isPending: false }
              : msg,
          );
          // Supprimer du localStorage si c'était un message en attente sauvegardé
          if (matchingPending.tempId.startsWith("pending-")) {
            removePendingMessage(matchingPending.tempId);
          }
          return updated;
        }

        // Vérifier les doublons (pour éviter d'ajouter le même message deux fois)
        if (isMessageDuplicate(data, prevMessages)) {
          return prevMessages;
        }

        // Pour les messages d'images de l'utilisateur, vérifier s'il y a déjà un message similaire
        if (isImageMessage && isOwnMessage) {
          const similarMessage = prevMessages.find((msg) => {
            if (msg.roomName !== data.roomName) return false;
            if (msg.imageUrl && data.imageUrl) {
              try {
                const msgBase64 = msg.imageUrl.startsWith("data:image")
                  ? extractBase64FromDataUrl(msg.imageUrl)
                  : msg.imageUrl;
                const dataBase64 = data.imageUrl.startsWith("data:image")
                  ? extractBase64FromDataUrl(data.imageUrl)
                  : data.imageUrl;
                if (
                  msgBase64.substring(0, 100) === dataBase64.substring(0, 100)
                ) {
                  return true;
                }
              } catch {
                // Ignorer les erreurs d'extraction
              }
            }
            return false;
          });

          if (similarMessage) {
            return prevMessages;
          }
        }

        return [...prevMessages, data];
      });
    };

    const cleanup = socket.getMessages(handleNewMessage);

    // Nettoyer le listener quand le composant se démonte ou les dépendances changent
    return () => {
      if (cleanup) cleanup();
    };
  }, [
    socket,
    selectedRoomName,
    isMessageDuplicate,
    removePendingMessage,
    user?.username,
    permission,
    isRoomNotificationEnabled,
    sendNotification,
  ]);

  const addMessage = useCallback((message: Message) => {
    setMessages((prevMessages) => [...prevMessages, message]);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    addMessage,
    clearMessages,
    setMessages,
  };
}
