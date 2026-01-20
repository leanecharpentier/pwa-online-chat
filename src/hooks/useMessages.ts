import type { Message } from "@/types";
import { useCallback, useEffect, useState } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { useOffline } from "./useOffline";
import { logger } from "@/lib/logger";
import { normalizeImageContent } from "@/lib/imageUtils";

interface UseMessagesOptions {
  selectedRoomName: string;
  isOnline: boolean;
}

export function useMessages({ selectedRoomName, isOnline }: UseMessagesOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const socket = useSocket();
  const {
    getPendingMessages,
    addPendingMessage,
    removePendingMessage,
    markMessageAsSent,
  } = useOffline();

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
              logger.error("Erreur lors de l'envoi du message en attente:", error);
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
      if (data.roomName !== selectedRoomName) {
        return;
      }

      // Traitement des images
      if (data.categorie === "NEW_IMAGE" && data.content) {
        data.imageUrl = normalizeImageContent(data.content);

        if (data.userId && !data.pseudo) {
          data.pseudo = data.userId;
        }
      }

      setMessages((prevMessages) => {
        // Vérifier si c'est un message qui correspond à un message en attente
        const matchingPending = prevMessages.find(
          (msg) =>
            msg.isPending &&
            msg.tempId &&
            msg.content === data.content &&
            msg.roomName === data.roomName &&
            Math.abs(
              new Date(msg.dateEmis).getTime() -
                new Date(data.dateEmis).getTime(),
            ) < 5000,
        );

        if (matchingPending) {
          const updated = prevMessages.map((msg) =>
            msg.tempId === matchingPending.tempId
              ? { ...data, isPending: false }
              : msg,
          );
          removePendingMessage(matchingPending.tempId!);
          return updated;
        }

        if (isMessageDuplicate(data, prevMessages)) {
          return prevMessages;
        }
        return [...prevMessages, data];
      });
    };

    socket.getMessages(handleNewMessage);
  }, [socket, selectedRoomName, isMessageDuplicate, removePendingMessage]);

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

