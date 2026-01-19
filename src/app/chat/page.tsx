"use client";

import { CameraModal } from "@/components/CameraModal";
import { CreateRoomModal } from "@/components/chat/CreateRoomModal";
import { GallerySelector } from "@/components/chat/GallerySelector";
import { MessageInput } from "@/components/chat/MessageInput";
import { MessageList } from "@/components/chat/MessageList";
import { RoomList } from "@/components/chat/RoomList";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import { useRooms } from "@/hooks/useRooms";
import API from "@/lib/api";
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
  const [isGallerySelectorOpen, setIsGallerySelectorOpen] =
    useState<boolean>(false);

  const socket = useSocket();
  const { user } = useAuth();
  const { rooms, loading, error, fetchRooms } = useRooms();

  const handlePhotoCapture = async (imageDataUrl: string) => {
    // Vérifier que l'image est valide
    if (!imageDataUrl.startsWith("data:image")) {
      alert("Erreur: format d'image invalide");
      return;
    }

    if (!selectedRoomName) {
      alert("Erreur: aucune salle sélectionnée");
      return;
    }

    const pseudo = user?.username || "Utilisateur";

    // Vérifier que le socket est connecté et a un id
    if (!socket.socket) {
      alert("Erreur: socket non initialisé. Veuillez rafraîchir la page.");
      return;
    }

    if (!socket.socket.connected) {
      // Attendre que le socket se connecte (max 5 secondes)
      try {
        await new Promise<void>((resolve, reject) => {
          if (!socket.socket) {
            reject(new Error("Socket non initialisé"));
            return;
          }

          const timeout = setTimeout(() => {
            reject(new Error("Timeout: le socket ne s'est pas connecté"));
          }, 5000);

          if (socket.socket.connected) {
            clearTimeout(timeout);
            resolve();
            return;
          }

          socket.socket.once("connect", () => {
            clearTimeout(timeout);
            resolve();
          });

          socket.socket.once("connect_error", (error) => {
            clearTimeout(timeout);
            reject(error);
          });
        });
      } catch (error) {
        console.error("Erreur de connexion socket:", error);
        alert(
          "Erreur: impossible de se connecter au serveur. Veuillez réessayer."
        );
        return;
      }
    }

    if (!socket.socket.id) {
      alert("Erreur: socket ID non disponible. Veuillez réessayer.");
      return;
    }

    // S'assurer que la salle est jointe dans le contexte socket
    if (socket.currentRoomName !== selectedRoomName) {
      socket.joinRoom(selectedRoomName);
    }

    // Essayer d'envoyer l'image à l'API (optionnel, peut échouer à cause de CORS)
    // Si ça échoue, on continue quand même avec l'envoi via socket
    try {
      await API.postImage(imageDataUrl, socket.socket.id);
      console.log("✅ Image envoyée à l'API avec succès");
    } catch (error) {
      console.warn(
        "⚠️ Erreur lors de l'envoi de l'image à l'API (CORS possible):",
        error
      );
      // On continue quand même, l'image sera envoyée via socket
    }

    // Sauvegarder la photo dans localStorage pour la galerie
    const photoData = {
      id: Date.now().toString(),
      imageUrl: imageDataUrl,
      dateEmis: new Date().toISOString(),
      roomName: selectedRoomName,
      pseudo,
    };

    // Récupérer les photos existantes
    const savedPhotos = localStorage.getItem("galleryPhotos");
    const photos = savedPhotos ? JSON.parse(savedPhotos) : [];
    photos.push(photoData);

    // Sauvegarder dans localStorage
    try {
      localStorage.setItem("galleryPhotos", JSON.stringify(photos));
      globalThis.dispatchEvent(new Event("galleryUpdated"));
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

    // Extraire le base64 pour l'envoi
    const base64Data = imageDataUrl.split(",")[1] || "";

    console.log("📤 Préparation envoi image:", {
      imageDataUrlLength: imageDataUrl.length,
      base64DataLength: base64Data.length,
      base64Preview: base64Data.substring(0, 50) + "...",
      startsWithDataImage: imageDataUrl.startsWith("data:image"),
    });

    // Créer un message local pour afficher l'image immédiatement
    const photoMessage: Message = {
      content: base64Data, // base64 sans le préfixe (comme ce qui sera envoyé via socket)
      categorie: "NEW_IMAGE", // Catégorie selon la doc API
      dateEmis: new Date().toISOString(),
      roomName: selectedRoomName,
      pseudo,
      userId: socket.socket.id, // Utiliser socket.id comme userId
      imageUrl: imageDataUrl, // data URL complet pour l'affichage immédiat
      imageId: socket.socket.id,
    };

    console.log("📸 Création message image local:", {
      hasContent: !!photoMessage.content,
      contentLength: photoMessage.content.length,
      hasImageUrl: !!photoMessage.imageUrl,
      imageUrlPreview:
        photoMessage.imageUrl && photoMessage.imageUrl.length > 0
          ? photoMessage.imageUrl.substring(0, 50)
          : "",
    });

    // Ajouter le message à l'état pour l'afficher immédiatement
    setMessages((prevMessages) => [...prevMessages, photoMessage]);

    // Envoyer l'image via socket
    if (socket.socket?.id) {
      socket.sendImage(imageDataUrl, socket.socket.id);
    }
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
      `${message.dateEmis}-${message.pseudo || message.userId}-${message.content?.substring(0, 50)}`,
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

    const handleNewMessage = async (data: Message) => {
      if (data.roomName !== selectedRoomName) {
        console.log("⚠️ Message ignoré (mauvaise salle):", {
          messageRoom: data.roomName,
          selectedRoom: selectedRoomName,
        });
        return;
      }

      console.log("🔄 Traitement du message:", {
        categorie: data.categorie,
        hasContent: !!data.content,
        contentPreview: data.content?.substring(0, 50),
      });

      // Si c'est un message avec une image (categorie: "NEW_IMAGE" selon la doc)
      if (data.categorie === "NEW_IMAGE" && data.content) {
        // Le serveur retourne soit :
        // 1. Une URL d'image (ex: https://api.tools.gavago.fr/socketio/api/images/4DC5oAU_jAFik9XDABuQ)
        // 2. Du base64 (si on reçoit directement)
        // 3. Un data URL

        if (
          data.content.startsWith("http://") ||
          data.content.startsWith("https://")
        ) {
          // C'est une URL d'image retournée par le serveur
          data.imageUrl = data.content;
          console.log("✅ Image URL reçue du serveur:", data.content);
        } else if (data.content.startsWith("data:image")) {
          // C'est déjà un data URL
          data.imageUrl = data.content;
          console.log("✅ Image déjà en format data URL");
        } else {
          // C'est du base64, on le convertit en data URL
          data.imageUrl = `data:image/jpeg;base64,${data.content}`;
          console.log(
            "✅ Image convertie en data URL depuis base64, longueur:",
            data.content.length
          );
        }

        // Mapper userId vers pseudo pour l'affichage si nécessaire
        if (data.userId && !data.pseudo) {
          data.pseudo = data.userId;
        }

        console.log(
          "🖼️ ImageUrl final:",
          data.imageUrl ? data.imageUrl.substring(0, 80) + "..." : "non défini"
        );
      }

      setMessages((prevMessages) => {
        if (isMessageDuplicate(data, prevMessages)) {
          console.log("⚠️ Message dupliqué ignoré");
          return prevMessages;
        }
        console.log("✅ Message ajouté à la liste");
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

  const handleBatteryClick = async () => {
    if (!selectedRoomName) {
      alert("Erreur: aucune salle sélectionnée");
      return;
    }

    // Vérifier que le socket est connecté
    if (!socket.socket || !socket.socket.connected || !socket.socket.id) {
      alert("Erreur: socket non connecté. Veuillez attendre la connexion.");
      return;
    }

    // S'assurer que la salle est jointe dans le contexte socket
    if (socket.currentRoomName !== selectedRoomName) {
      socket.joinRoom(selectedRoomName);
    }

    try {
      // Obtenir le niveau de batterie
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

      // Créer le message avec le niveau de batterie
      const batteryMessage = `🔋 Batterie: ${batteryLevel}%${isCharging ? " (en charge)" : ""}`;

      // Envoyer le message via socket
      socket.sendMessage(batteryMessage);
    } catch (error) {
      console.error("Erreur lors de la récupération de la batterie:", error);
      alert(
        "Erreur: impossible d'accéder aux informations de batterie. Cette fonctionnalité n'est peut-être pas supportée par votre navigateur."
      );
    }
  };

  const handleLocationClick = () => {
    if (!selectedRoomName) {
      alert("Erreur: aucune salle sélectionnée");
      return;
    }

    // Vérifier que le socket est connecté
    if (!socket.socket || !socket.socket.connected || !socket.socket.id) {
      alert("Erreur: socket non connecté. Veuillez attendre la connexion.");
      return;
    }

    // S'assurer que la salle est jointe dans le contexte socket
    if (socket.currentRoomName !== selectedRoomName) {
      socket.joinRoom(selectedRoomName);
    }

    // Vérifier si la géolocalisation est disponible
    if (!navigator.geolocation) {
      alert(
        "Erreur: la géolocalisation n'est pas supportée par votre navigateur."
      );
      return;
    }

    // Demander la permission et récupérer la position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const accuracy = Math.round(position.coords.accuracy);

        // Créer le message avec la position et un lien Google Maps
        const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
        const locationMessage = `📍 Ma position: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (précision: ${accuracy}m)\n${googleMapsUrl}`;

        // Envoyer le message via socket
        socket.sendMessage(locationMessage);
      },
      (error) => {
        console.error("Erreur lors de la récupération de la position:", error);
        let errorMessage = "Erreur: impossible d'obtenir votre position.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage =
              "Erreur: permission de géolocalisation refusée. Veuillez autoriser l'accès à votre position.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage =
              "Erreur: position indisponible. Vérifiez que votre GPS est activé.";
            break;
          case error.TIMEOUT:
            errorMessage =
              "Erreur: timeout lors de la récupération de la position. Veuillez réessayer.";
            break;
        }
        alert(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
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
