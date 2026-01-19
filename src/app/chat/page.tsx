"use client";

import { CameraModal } from "@/components/CameraModal";
import { CreateRoomModal } from "@/components/chat/CreateRoomModal";
import { MessageInput } from "@/components/chat/MessageInput";
import { MessageList } from "@/components/chat/MessageList";
import { RoomList } from "@/components/chat/RoomList";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import { useRooms } from "@/hooks/useRooms";
import type { Message } from "@/types";
import { useCallback, useEffect, useState } from "react";

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedRoomName, setSelectedRoomName] = useState<string>("");
  const [newMessage, setNewMessage] = useState<string>("");
  const [newRoomName, setNewRoomName] = useState<string>("");
  const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] =
    useState<boolean>(false);
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);

  const socket = useSocket();
  const { user } = useAuth();
  const { rooms, loading, error, fetchRooms } = useRooms();

  const handlePhotoCapture = (imageDataUrl: string) => {
    // Vérifier que l'image est valide
    if (!imageDataUrl.startsWith("data:image")) {
      alert("Erreur: format d'image invalide");
      return;
    }

    // Sauvegarder la photo dans localStorage
    const photoData = {
      id: Date.now().toString(),
      imageUrl: imageDataUrl,
      dateEmis: new Date().toISOString(),
      roomName: selectedRoomName,
      pseudo: user?.username || "Utilisateur",
    };

    // Récupérer les photos existantes
    const savedPhotos = localStorage.getItem("galleryPhotos");
    const photos = savedPhotos ? JSON.parse(savedPhotos) : [];
    photos.push(photoData);

    // Sauvegarder dans localStorage
    try {
      localStorage.setItem("galleryPhotos", JSON.stringify(photos));
      window.dispatchEvent(new Event("galleryUpdated"));
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      if (error instanceof Error && error.name === "QuotaExceededError") {
        alert(
          "Erreur: L'espace de stockage est plein. Veuillez supprimer des photos."
        );
      } else {
        alert("Erreur lors de la sauvegarde de la photo");
      }
      return;
    }

    // Créer un message avec l'image
    const photoMessage: Message = {
      content: "Photo partagée",
      categorie: "image",
      dateEmis: new Date().toISOString(),
      roomName: selectedRoomName,
      pseudo: user?.username || "Utilisateur",
      imageUrl: imageDataUrl,
    };

    // Ajouter le message à l'état
    setMessages((prevMessages) => [...prevMessages, photoMessage]);

    // Envoyer un message via socket
    const simpleMessage = `📸 ${user?.username || "Utilisateur"} a partagé une photo`;
    socket.sendMessage(simpleMessage);
  };

  useEffect(() => {
    if (rooms.length > 0 && !selectedRoomName) {
      setSelectedRoomName(rooms[0].name);
    }
  }, [rooms, selectedRoomName]);

  const handleRoomSelection = (roomName: string) => {
    setSelectedRoomName(roomName);
    setMessages([]);
    socket.joinRoom(roomName);
  };

  const createMessageKey = useCallback(
    (message: Message) =>
      `${message.dateEmis}-${message.pseudo}-${message.content}`,
    []
  );

  const isMessageDuplicate = useCallback(
    (newMessage: Message, existingMessages: Message[]) => {
      const newKey = createMessageKey(newMessage);
      return existingMessages.some((msg) => createMessageKey(msg) === newKey);
    },
    [createMessageKey]
  );

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data: Message) => {
      if (data.roomName !== selectedRoomName) return;

      setMessages((prevMessages) => {
        if (isMessageDuplicate(data, prevMessages)) {
          return prevMessages;
        }
        return [...prevMessages, data];
      });
    };

    socket.getMessages(handleNewMessage);
  }, [socket, selectedRoomName, isMessageDuplicate]);

  const selectedRoom = rooms.find((room) => room.name === selectedRoomName);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      socket.sendMessage(newMessage);
      setNewMessage("");
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

  return (
    <div className="flex h-full bg-gray-50">
      <aside className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
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
        </div>

        <div className="flex-1 overflow-y-auto">
          <RoomList
            rooms={rooms}
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
                  <p className="text-sm text-gray-500">En ligne</p>
                </div>
              </div>
            </div>

            <MessageList messages={messages} currentUser={user} />

            <MessageInput
              value={newMessage}
              onChange={setNewMessage}
              onSend={handleSendMessage}
              onCameraClick={() => setIsCameraOpen(true)}
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
      </main>
    </div>
  );
}
