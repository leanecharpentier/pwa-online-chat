"use client";

import type { Room } from "@/types";
import { useNotificationSettings } from "@/hooks/useNotificationSettings";

interface RoomItemProps {
  room: Room;
  isSelected: boolean;
  onSelect: (roomName: string) => void;
}

export function RoomItem({ room, isSelected, onSelect }: RoomItemProps) {
  const { isRoomNotificationEnabled, toggleRoomNotifications } =
    useNotificationSettings();
  const notificationsEnabled = isRoomNotificationEnabled(room.name);

  const handleToggleNotifications = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleRoomNotifications(room.name);
  };

  return (
    <div
      onClick={() => onSelect(room.name)}
      className={`w-full text-left p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
        isSelected ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
      }`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(room.name);
        }
      }}
    >
      <div className="flex items-center space-x-3">
        <div className="text-2xl">{room.avatar}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900 truncate">
              {decodeURIComponent(room.name)}
            </h3>
            <button
              onClick={handleToggleNotifications}
              className="ml-2 p-1.5 rounded-full hover:bg-gray-200 transition-colors"
              title={
                notificationsEnabled
                  ? "Désactiver les notifications"
                  : "Activer les notifications"
              }
              aria-label={
                notificationsEnabled
                  ? "Désactiver les notifications"
                  : "Activer les notifications"
              }
            >
              <span className="text-lg">
                {notificationsEnabled ? "🔔" : "🔕"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
