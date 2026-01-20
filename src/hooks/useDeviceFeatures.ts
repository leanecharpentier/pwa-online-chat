import { useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import { useOffline } from "./useOffline";
import { logger } from "@/lib/logger";
import { showError, ErrorMessages } from "@/lib/errors";
import type { Message } from "@/types";

interface UseDeviceFeaturesOptions {
  selectedRoomName: string;
  isOnline: boolean;
  onMessageAdded: (message: Message) => void;
}

export function useDeviceFeatures({
  selectedRoomName,
  isOnline,
  onMessageAdded,
}: UseDeviceFeaturesOptions) {
  const { user } = useAuth();
  const socket = useSocket();
  const { addPendingMessage } = useOffline();

  const ensureSocketReady = useCallback(() => {
    if (!selectedRoomName) {
      showError("NO_ROOM_SELECTED");
      return false;
    }

    if (!socket.socket || !socket.socket.connected || !socket.socket.id) {
      showError("SOCKET_NOT_CONNECTED");
      return false;
    }

    if (socket.currentRoomName !== selectedRoomName) {
      socket.joinRoom(selectedRoomName);
    }

    return true;
  }, [selectedRoomName, socket]);

  const sendMessage = useCallback(
    (content: string) => {
      if (isOnline && socket.socket?.connected) {
        socket.sendMessage(content);
      } else {
        const pseudo = user?.username || "Utilisateur";
        const messageData: Message = {
          content,
          categorie: "MESSAGE",
          dateEmis: new Date().toISOString(),
          roomName: selectedRoomName,
          pseudo,
          userId: socket.socket?.id || "",
        };
        const pendingMessage = addPendingMessage(messageData);
        onMessageAdded(pendingMessage);
      }
    },
    [isOnline, socket, user, selectedRoomName, addPendingMessage, onMessageAdded],
  );

  const handleBatteryClick = useCallback(async () => {
    if (!ensureSocketReady()) return;

    try {
      interface BatteryManager {
        level: number;
        charging: boolean;
      }

      const navigatorWithBattery = navigator as typeof navigator & {
        getBattery: () => Promise<BatteryManager>;
      };

      const battery = await navigatorWithBattery.getBattery();
      const batteryLevel = Math.round(battery.level * 100);
      const isCharging = battery.charging;

      const batteryMessage = `🔋 Batterie: ${batteryLevel}%${isCharging ? " (en charge)" : ""}`;
      sendMessage(batteryMessage);
    } catch (error) {
      logger.error("Erreur lors de la récupération de la batterie:", error);
      showError("BATTERY_NOT_SUPPORTED");
    }
  }, [ensureSocketReady, sendMessage]);

  const handleLocationClick = useCallback(() => {
    if (!ensureSocketReady()) return;

    if (!navigator.geolocation) {
      showError("GEOLOCATION_NOT_SUPPORTED");
      return;
    }

    // Essayer d'abord avec une précision standard (plus rapide)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const accuracy = Math.round(position.coords.accuracy);

        const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
        const locationMessage = `📍 Ma position: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (précision: ${accuracy}m)\n${googleMapsUrl}`;

        sendMessage(locationMessage);
      },
      (error) => {
        // Si timeout avec précision standard, réessayer avec haute précision
        if (error.code === error.TIMEOUT) {
          logger.info("Timeout avec précision standard, tentative avec haute précision...");
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const latitude = position.coords.latitude;
              const longitude = position.coords.longitude;
              const accuracy = Math.round(position.coords.accuracy);

              const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
              const locationMessage = `📍 Ma position: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (précision: ${accuracy}m)\n${googleMapsUrl}`;

              sendMessage(locationMessage);
            },
            (retryError) => {
              logger.error("Erreur lors de la récupération de la position:", retryError);
              switch (retryError.code) {
                case retryError.PERMISSION_DENIED:
                  showError("GEOLOCATION_PERMISSION_DENIED");
                  break;
                case retryError.POSITION_UNAVAILABLE:
                  showError("GEOLOCATION_UNAVAILABLE");
                  break;
                case retryError.TIMEOUT:
                  showError("GEOLOCATION_TIMEOUT");
                  break;
                default:
                  showError("GEOLOCATION_ERROR");
              }
            },
            {
              enableHighAccuracy: true,
              timeout: 20000,
              maximumAge: 0,
            },
          );
        } else {
          logger.error("Erreur lors de la récupération de la position:", error);
          switch (error.code) {
            case error.PERMISSION_DENIED:
              showError("GEOLOCATION_PERMISSION_DENIED");
              break;
            case error.POSITION_UNAVAILABLE:
              showError("GEOLOCATION_UNAVAILABLE");
              break;
            case error.TIMEOUT:
              showError("GEOLOCATION_TIMEOUT");
              break;
            default:
              showError("GEOLOCATION_ERROR");
          }
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 60000, // Accepter une position jusqu'à 1 minute
      },
    );
  }, [ensureSocketReady, sendMessage]);

  return {
    handleBatteryClick,
    handleLocationClick,
  };
}

