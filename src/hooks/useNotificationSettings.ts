"use client";

import { useCallback, useEffect, useState } from "react";
import { logger } from "@/lib/logger";

const NOTIFICATION_SETTINGS_KEY = "notificationSettings";

export interface NotificationSettings {
  [roomName: string]: boolean;
}

export function useNotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>({});

  // Charger les paramètres depuis localStorage
  const loadSettings = useCallback((): NotificationSettings => {
    if (typeof globalThis.window === "undefined") return {};
    try {
      const stored = globalThis.localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      logger.error(
        "Erreur lors de la lecture des paramètres de notifications:",
        error,
      );
      return {};
    }
  }, []);

  // Sauvegarder les paramètres dans localStorage
  const saveSettings = useCallback((newSettings: NotificationSettings) => {
    if (typeof globalThis.window === "undefined") return;
    try {
      globalThis.localStorage.setItem(
        NOTIFICATION_SETTINGS_KEY,
        JSON.stringify(newSettings),
      );
    } catch (error) {
      logger.error(
        "Erreur lors de la sauvegarde des paramètres de notifications:",
        error,
      );
    }
  }, []);

  // Charger les paramètres au montage
  useEffect(() => {
    setSettings(loadSettings());
  }, [loadSettings]);

  // Activer ou désactiver les notifications pour une room
  const toggleRoomNotifications = useCallback(
    (roomName: string) => {
      setSettings((prevSettings) => {
        const newSettings = {
          ...prevSettings,
          [roomName]: !prevSettings[roomName],
        };
        saveSettings(newSettings);
        return newSettings;
      });
    },
    [saveSettings],
  );

  // Vérifier si les notifications sont activées pour une room
  const isRoomNotificationEnabled = useCallback(
    (roomName: string): boolean => {
      return settings[roomName] === true;
    },
    [settings],
  );

  // Activer les notifications pour une room
  const enableRoomNotifications = useCallback(
    (roomName: string) => {
      setSettings((prevSettings) => {
        const newSettings = {
          ...prevSettings,
          [roomName]: true,
        };
        saveSettings(newSettings);
        return newSettings;
      });
    },
    [saveSettings],
  );

  // Désactiver les notifications pour une room
  const disableRoomNotifications = useCallback(
    (roomName: string) => {
      setSettings((prevSettings) => {
        const newSettings = {
          ...prevSettings,
          [roomName]: false,
        };
        saveSettings(newSettings);
        return newSettings;
      });
    },
    [saveSettings],
  );

  return {
    settings,
    toggleRoomNotifications,
    isRoomNotificationEnabled,
    enableRoomNotifications,
    disableRoomNotifications,
  };
}

