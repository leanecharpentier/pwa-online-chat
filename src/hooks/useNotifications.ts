"use client";

import { useCallback, useEffect, useState } from "react";
import { logger } from "@/lib/logger";
import type { Message } from "@/types";

export type NotificationPermission = "default" | "granted" | "denied";

export function useNotifications() {
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(false);

  // Vérifier le support et la permission au montage
  useEffect(() => {
    if (typeof globalThis.window === "undefined") return;

    const checkSupport = () => {
      const supported = "Notification" in window;
      setIsSupported(supported);

      if (supported) {
        setPermission(Notification.permission as NotificationPermission);
      }
    };

    checkSupport();
  }, []);

  // Demander la permission de notification
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      logger.warn("Les notifications ne sont pas supportées");
      return false;
    }

    if (permission === "granted") {
      return true;
    }

    if (permission === "denied") {
      logger.warn("La permission de notification a été refusée");
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      const newPermission = result as NotificationPermission;
      setPermission(newPermission);
      return newPermission === "granted";
    } catch (error) {
      logger.error("Erreur lors de la demande de permission:", error);
      return false;
    }
  }, [isSupported, permission]);

  // Envoyer une notification
  const sendNotification = useCallback(
    (message: Message, roomName?: string) => {
      if (!isSupported || permission !== "granted") {
        return;
      }

      try {
        const title = roomName
          ? `${decodeURIComponent(roomName)}`
          : "Nouveau message";

        // Formater le corps de la notification
        let body = "";
        if (message.pseudo && message.pseudo !== "SERVER") {
          body = `${message.pseudo}: `;
        }

        // Gérer les messages avec images
        if (message.imageUrl || message.categorie === "NEW_IMAGE") {
          body += "📷 Image";
        } else {
          const content = message.content.substring(0, 100);
          body += content;
          if (message.content.length > 100) {
            body += "...";
          }
        }

        // Créer un tag unique pour chaque notification
        // Utiliser un timestamp avec un random pour éviter les collisions
        const uniqueTag = `message-${message.roomName}-${message.id || `${Date.now()}-${Math.random()}`}`;

        const notification = new Notification(title, {
          body,
          icon: "/next.svg",
          badge: "/next.svg",
          tag: uniqueTag,
          requireInteraction: false,
        });

        logger.info("Notification envoyée:", { title, body, tag: uniqueTag });

        // Fermer automatiquement la notification après 5 secondes
        setTimeout(() => {
          notification.close();
        }, 5000);

        // Gérer le clic sur la notification
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      } catch (error) {
        logger.error("Erreur lors de l'envoi de la notification:", error);
      }
    },
    [isSupported, permission],
  );

  return {
    isSupported,
    permission,
    requestPermission,
    sendNotification,
  };
}
