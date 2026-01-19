import type { Room } from "@/types";

interface RoomItemProps {
  room: Room;
  isSelected: boolean;
  onSelect: (roomName: string) => void;
}

export function RoomItem({ room, isSelected, onSelect }: RoomItemProps) {
  return (
    <button
      onClick={() => onSelect(room.name)}
      className={`w-full text-left p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
        isSelected ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
      }`}
    >
      <div className="flex items-center space-x-3">
        <div className="text-2xl">{room.avatar}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900 truncate">
              {decodeURIComponent(room.name)}
            </h3>
          </div>
        </div>
      </div>
    </button>
  );
}
