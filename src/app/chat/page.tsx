"use client";

import { CameraModal } from "@/components/CameraModal";
import { CreateRoomModal } from "@/components/chat/CreateRoomModal";
import { GallerySelector } from "@/components/chat/GallerySelector";
import { MessageInput } from "@/components/chat/MessageInput";
import { MessageList } from "@/components/chat/MessageList";
import { RoomList } from "@/components/chat/RoomList";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import { useOffline } from "@/hooks/useOffline";
import { useRooms } from "@/hooks/useRooms";
import { useMessages } from "@/hooks/useMessages";
import { usePhotoCapture } from "@/hooks/usePhotoCapture";
import { useDeviceFeatures } from "@/hooks/useDeviceFeatures";
import type { Message } from "@/types";
import { useEffect, useState, useMemo } from "react";

export default function ChatPage() {
  const [selectedRoomName, setSelectedRoomName] = useState<string>("");
  const [newMessage, setNewMessage] = useState<string>("");
  const [newRoomName, setNewRoomName] = useState<string>("");
  const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState<boolean>(false);
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [isGallerySelectorOpen, setIsGallerySelectorOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const socket = useSocket();
  const { user } = useAuth();
  const { rooms, loading, error, fetchRooms } = useRooms();
  const { isOnline, addPendingMessage } = useOffline();

  const { messages, addMessage, clearMessages } = useMessages({
    selectedRoomName,
    isOnline,
  });

  const { handlePhotoCapture } = usePhotoCapture({
    selectedRoomName,
    isOnline,
    onMessageAdded: addMessage,
  });

  const { handleBatteryClick, handleLocationClick } = useDeviceFeatures({
    selectedRoomName,
    isOnline,
    onMessageAdded: addMessage,
  });

  // Sélectionner automatiquement la première salle
  useEffect(() => {
    if (rooms.length > 0 && !selectedRoomName) {
      setSelectedRoomName(rooms[0].name);
    }
  }, [rooms, selectedRoomName]);

  const handleRoomSelection = (roomName: string) => {
    setSelectedRoomName(roomName);
    clearMessages();
    socket.joinRoom(roomName);
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const pseudo = user?.username || "Utilisateur";
      const messageData: Message = {
        content: newMessage.trim(),
        categorie: "MESSAGE",
        dateEmis: new Date().toISOString(),
        roomName: selectedRoomName,
        pseudo,
        userId: socket.socket?.id || "",
      };

      if (isOnline && socket.socket?.connected) {
        socket.sendMessage(newMessage.trim());
        setNewMessage("");
      } else {
        const pendingMessage = addPendingMessage(messageData);
        addMessage(pendingMessage);
        setNewMessage("");
      }
    }
  };

  const handleCreateRoom = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (newRoomName.trim()) {
      socket.joinRoom(newRoomName.trim());
      const roomName = newRoomName.trim();
      setNewRoomName("");
      await fetchRooms();
      setSelectedRoomName(roomName);
      setIsCreateRoomModalOpen(false);
    }
  };

  const selectedRoom = rooms.find((room) => room.name === selectedRoomName);

  // Filtrer les rooms en fonction de la recherche
  const filteredRooms = useMemo(() => {
    if (!searchQuery.trim()) {
      return rooms;
    }
    const query = searchQuery.toLowerCase().trim();
    return rooms.filter((room) =>
      decodeURIComponent(room.name).toLowerCase().includes(query)
    );
  }, [rooms, searchQuery]);

  return (
    <div className="flex h-full bg-gray-50">
      <aside className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold text-gray-800">
              Conversations
            </h2>
            <CreateRoomModal
              isOpen={isCreateRoomModalOpen}
              onOpenChange={setIsCreateRoomModalOpen}
              roomName={newRoomName}
              onRoomNameChange={setNewRoomName}
              onSubmit={handleCreateRoom}
            />
          </div>
          <Input
            type="text"
            placeholder="Rechercher une conversation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          <RoomList
            rooms={filteredRooms}
            selectedRoomName={selectedRoomName}
            loading={loading}
            error={error}
            onRoomSelect={handleRoomSelection}
            onRetry={fetchRooms}
          />
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        {selectedRoom ? (
          <>
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{selectedRoom.avatar}</div>
                <div>
                  <h1 className="font-semibold text-gray-900">
                    {decodeURIComponent(selectedRoom.name)}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {isOnline ? "En ligne" : "Hors ligne"}
                  </p>
                </div>
              </div>
            </div>

            <MessageList messages={messages} currentUser={user} />

            <MessageInput
              value={newMessage}
              onChange={setNewMessage}
              onSend={handleSendMessage}
              onCameraClick={() => setIsCameraOpen(true)}
              onGalleryClick={() => setIsGallerySelectorOpen(true)}
              onBatteryClick={handleBatteryClick}
              onLocationClick={handleLocationClick}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500">
              Sélectionnez une conversation pour commencer
            </p>
          </div>
        )}

        <CameraModal
          isOpen={isCameraOpen}
          onClose={() => setIsCameraOpen(false)}
          onCapture={handlePhotoCapture}
          actionLabel="Envoyer"
          actionIcon="📤"
        />

        <GallerySelector
          isOpen={isGallerySelectorOpen}
          onClose={() => setIsGallerySelectorOpen(false)}
          onSelect={handlePhotoCapture}
        />
      </main>
    </div>
  );
}
