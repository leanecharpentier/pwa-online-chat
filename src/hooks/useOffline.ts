"use client";

import type { Message } from "@/types";
import { useCallback, useEffect, useState } from "react";

const PENDING_MESSAGES_KEY = "pendingMessages";

export interface PendingMessage extends Message {
  tempId: string; // ID temporaire unique pour identifier le message
  isPending: boolean;
}

export function useOffline() {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof globalThis.navigator !== "undefined"
      ? globalThis.navigator.onLine
      : true,
  );

  // Charger les messages en attente depuis localStorage
  const getPendingMessages = useCallback((): PendingMessage[] => {
    if (typeof globalThis.window === "undefined") return [];
    try {
      const stored = globalThis.localStorage.getItem(PENDING_MESSAGES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error(
        "Erreur lors de la lecture des messages en attente:",
        error,
      );
      return [];
    }
  }, []);

  // Sauvegarder les messages en attente dans localStorage
  const savePendingMessages = useCallback((messages: PendingMessage[]) => {
    if (typeof globalThis.window === "undefined") return;
    try {
      globalThis.localStorage.setItem(
        PENDING_MESSAGES_KEY,
        JSON.stringify(messages),
      );
    } catch (error) {
      console.error(
        "Erreur lors de la sauvegarde des messages en attente:",
        error,
      );
    }
  }, []);

  // Ajouter un message en attente
  const addPendingMessage = useCallback(
    (message: Omit<PendingMessage, "tempId" | "isPending">) => {
      const pendingMessage: PendingMessage = {
        ...message,
        tempId: `pending-${Date.now()}-${Math.random()}`,
        isPending: true,
      };
      const pending = getPendingMessages();
      pending.push(pendingMessage);
      savePendingMessages(pending);
      return pendingMessage;
    },
    [getPendingMessages, savePendingMessages],
  );

  // Supprimer un message en attente (après envoi réussi)
  const removePendingMessage = useCallback(
    (tempId: string) => {
      const pending = getPendingMessages();
      const filtered = pending.filter((msg) => msg.tempId !== tempId);
      savePendingMessages(filtered);
    },
    [getPendingMessages, savePendingMessages],
  );

  // Marquer un message comme envoyé (mise à jour de l'état)
  const markMessageAsSent = useCallback(
    (tempId: string) => {
      const pending = getPendingMessages();
      const updated = pending.map((msg) =>
        msg.tempId === tempId ? { ...msg, isPending: false } : msg,
      );
      savePendingMessages(updated);
    },
    [getPendingMessages, savePendingMessages],
  );

  // Vider tous les messages en attente
  const clearPendingMessages = useCallback(() => {
    if (typeof globalThis.window === "undefined") return;
    try {
      globalThis.localStorage.removeItem(PENDING_MESSAGES_KEY);
    } catch (error) {
      console.error(
        "Erreur lors de la suppression des messages en attente:",
        error,
      );
    }
  }, []);

  // Écouter les changements d'état de connexion
  useEffect(() => {
    const handleOnline = () => {
      console.log("✅ Connexion rétablie");
      setIsOnline(true);
    };

    const handleOffline = () => {
      console.log("❌ Connexion perdue");
      setIsOnline(false);
    };

    globalThis.addEventListener("online", handleOnline);
    globalThis.addEventListener("offline", handleOffline);

    return () => {
      globalThis.removeEventListener("online", handleOnline);
      globalThis.removeEventListener("offline", handleOffline);
    };
  }, []);

  return {
    isOnline,
    getPendingMessages,
    addPendingMessage,
    removePendingMessage,
    markMessageAsSent,
    clearPendingMessages,
  };
}
