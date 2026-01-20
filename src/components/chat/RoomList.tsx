import { Button } from "@/components/ui/button";
import { RoomItem } from "./RoomItem";
import type { Room } from "@/types";

interface RoomListProps {
  rooms: Room[];
  selectedRoomName: string;
  loading: boolean;
  error: string | null;
  onRoomSelect: (roomName: string) => void;
  onRetry: () => void;
}

export function RoomList({
  rooms,
  selectedRoomName,
  loading,
  error,
  onRoomSelect,
  onRetry,
}: RoomListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">
            Chargement des conversations...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="p-2 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
          <div className="flex items-center justify-between">
            <span>Erreur: {error}</span>
            <Button
              onClick={onRetry}
              variant="outline"
              size="sm"
              className="ml-2"
            >
              Réessayer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-500">Aucune conversation disponible</p>
      </div>
    );
  }

  return (
    <>
      {rooms.map((room) => (
        <RoomItem
          key={room.name}
          room={room}
          isSelected={selectedRoomName === room.name}
          onSelect={onRoomSelect}
        />
      ))}
    </>
  );
}
