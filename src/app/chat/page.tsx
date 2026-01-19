"use client";

import { Modal } from "@/components/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import API from "@/lib/api";
import { formatTime } from "@/lib/utils";
import { useCallback, useEffect, useRef, useState } from "react";

interface Message {
    id?: string;
    content: string;
    categorie: string;
    dateEmis: string;
    roomName: string;
    pseudo: string;
    imageUrl?: string;
}

interface Room {
    name: string;
    avatar: string;
}

export default function ChatPage() {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const [selectedRoomName, setSelectedRoomName] = useState<string>("");
    const [newMessage, setNewMessage] = useState<string>("");
    const [newRoomName, setNewRoomName] = useState<string>("");
    const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] =
        useState<boolean>(false);
    const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [cameraLoading, setCameraLoading] = useState<boolean>(false);

    const socket = useSocket();
    const { user } = useAuth();

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const startCamera = () => {
        setIsCameraOpen(true);
    };

    // Initialiser la caméra quand la modal s'ouvre
    useEffect(() => {
        if (!isCameraOpen) {
            // Nettoyer si la modal se ferme
            if (videoRef.current?.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
                videoRef.current.srcObject = null;
            }
            return;
        }

        let stream: MediaStream | null = null;
        let cancelled = false;

        const initCamera = async () => {
            setCameraLoading(true);
            try {
                console.log("Demande d'accès à la caméra...");
                console.log("videoRef.current:", videoRef.current);
                
                // Attendre que l'élément vidéo soit monté (jusqu'à 2 secondes)
                let attempts = 0;
                while (!videoRef.current && attempts < 20) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    attempts++;
                    console.log(`Tentative ${attempts}/20 - videoRef.current:`, videoRef.current);
                }
                
                if (!videoRef.current) {
                    console.error("Élément vidéo non trouvé après 20 tentatives");
                    throw new Error("Élément vidéo non disponible");
                }
                
                console.log("Élément vidéo trouvé, demande d'accès à la caméra...");
                stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { 
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    } 
                });
                
                if (cancelled) {
                    console.log("Initialisation annulée");
                    stream.getTracks().forEach(track => track.stop());
                    return;
                }
                
                console.log("Stream obtenu:", stream);
                console.log("Tracks actifs:", stream.getTracks().length);
                
                // Assigner le stream à l'élément vidéo
                const videoEl = videoRef.current;
                if (videoEl && !cancelled) {
                    videoEl.srcObject = stream;
                    console.log("Stream assigné à l'élément vidéo");
                    
                    // Forcer la lecture
                    try {
                        await videoEl.play();
                        console.log("Vidéo en cours de lecture");
                    } catch (playError) {
                        console.error("Erreur lors de la lecture:", playError);
                    }
                } else {
                    console.error("Élément vidéo non disponible ou annulé");
                    stream.getTracks().forEach(track => track.stop());
                }
            } catch (error) {
                if (cancelled) {
                    console.log("Erreur ignorée car annulée");
                    return;
                }
                
                console.error("Erreur d'accès à la caméra:", error);
                const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
                alert(`Impossible d'accéder à la caméra: ${errorMessage}`);
                setIsCameraOpen(false);
                setCameraLoading(false);
            }
        };

        // Démarrer l'initialisation après un délai pour laisser le DOM se mettre à jour
        const timeoutId = setTimeout(() => {
            console.log("Démarrage de l'initialisation de la caméra");
            initCamera();
        }, 200);

        // Nettoyage au démontage
        return () => {
            cancelled = true;
            clearTimeout(timeoutId);
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            if (videoRef.current?.srcObject) {
                const currentStream = videoRef.current.srcObject as MediaStream;
                currentStream.getTracks().forEach(track => track.stop());
                videoRef.current.srcObject = null;
            }
        };
    }, [isCameraOpen]);

    const stopCamera = () => {
        if (videoRef.current?.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setIsCameraOpen(false);
        setCapturedImage(null);
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');
            
            // Vérifier que la vidéo est prête
            if (video.readyState < 2) {
                console.warn("La vidéo n'est pas encore prête, readyState:", video.readyState);
                alert("Veuillez attendre que la vidéo soit prête");
                return;
            }
            
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            if (context) {
                // S'assurer que le canvas a un fond blanc
                context.fillStyle = '#FFFFFF';
                context.fillRect(0, 0, canvas.width, canvas.height);
                
                // Dessiner l'image de la vidéo
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                // Vérifier que l'image n'est pas vide/noire
                const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                let hasContent = false;
                
                // Vérifier quelques pixels pour voir s'il y a du contenu
                for (let i = 0; i < data.length; i += 16) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    // Si ce n'est pas noir ou blanc pur, il y a du contenu
                    if (!(r === 0 && g === 0 && b === 0) && !(r === 255 && g === 255 && b === 255)) {
                        hasContent = true;
                        break;
                    }
                }
                
                if (!hasContent) {
                    console.warn("L'image capturée semble être vide ou noire");
                }
                
                const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
                console.log("Photo capturée - Dimensions:", canvas.width, "x", canvas.height);
                console.log("Photo capturée - Taille data URL:", imageDataUrl.length, "caractères");
                setCapturedImage(imageDataUrl);
            }
        }
    };

    const sendPhoto = () => {
        if (capturedImage) {
            // Vérifier que l'image est valide
            if (!capturedImage.startsWith('data:image')) {
                console.error("Format d'image invalide:", capturedImage.substring(0, 50));
                alert("Erreur: format d'image invalide");
                return;
            }
            
            console.log("Sauvegarde de la photo - Taille:", capturedImage.length, "caractères");
            console.log("Début de l'image:", capturedImage.substring(0, 100));
            
            // Sauvegarder la photo dans localStorage
            const photoData = {
                id: Date.now().toString(),
                imageUrl: capturedImage,
                dateEmis: new Date().toISOString(),
                roomName: selectedRoomName,
                pseudo: user?.username || "Utilisateur",
            };
            
            // Récupérer les photos existantes
            const savedPhotos = localStorage.getItem("galleryPhotos");
            const photos = savedPhotos ? JSON.parse(savedPhotos) : [];
            
            // Ajouter la nouvelle photo
            photos.push(photoData);
            
            // Sauvegarder dans localStorage
            try {
                localStorage.setItem("galleryPhotos", JSON.stringify(photos));
                console.log("Photo sauvegardée avec succès. Total photos:", photos.length);
                
                // Déclencher un événement personnalisé pour rafraîchir la gallery
                window.dispatchEvent(new Event("galleryUpdated"));
                
                // Vérifier que la sauvegarde a fonctionné
                const verification = localStorage.getItem("galleryPhotos");
                if (verification) {
                    const verified = JSON.parse(verification);
                    const lastPhoto = verified[verified.length - 1];
                    console.log("Vérification - Dernière photo sauvegardée:", {
                        id: lastPhoto.id,
                        imageUrlLength: lastPhoto.imageUrl?.length,
                        imageUrlStart: lastPhoto.imageUrl?.substring(0, 50)
                    });
                }
            } catch (error) {
                console.error("Erreur lors de la sauvegarde:", error);
                if (error instanceof Error && error.name === 'QuotaExceededError') {
                    alert("Erreur: L'espace de stockage est plein. Veuillez supprimer des photos.");
                } else {
                    alert("Erreur lors de la sauvegarde de la photo");
                }
                return;
            }
            
            // Créer un message avec l'image (simulation)
            const photoMessage: Message = {
                content: "Photo partagée",
                categorie: "image",
                dateEmis: new Date().toISOString(),
                roomName: selectedRoomName,
                pseudo: user?.username || "Utilisateur",
                imageUrl: capturedImage
            };
            
            // Ajouter directement le message à l'état (simulation)
            setMessages((prevMessages) => [...prevMessages, photoMessage]);
            
            // Dans une vraie app, vous feriez : socket.sendMessage avec l'URL de l'image
            const simpleMessage = `📸 ${user?.username || "Utilisateur"} a partagé une photo`;
            socket.sendMessage(simpleMessage);
            
            // Réinitialiser la caméra
            stopCamera();
            console.log("Photo envoyée et sauvegardée:", capturedImage.substring(0, 50) + "...");
        }
    };

    const retakePhoto = () => {
        setCapturedImage(null);
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchRooms = async () => {
        setLoading(true);
        setError(null);

        try {
            const data = await API.getRooms();
            const rooms: Room[] = Object.keys(data.data).map((room, index) => ({
                name: room,
                avatar: ["💬", "👥", "🔧", "📝", "🎯"][index % 5],
            }));
            setRooms(rooms);
            if (rooms.length > 0) {
                setSelectedRoomName(rooms[0].name);
            }
        } catch (err) {
            console.error("Erreur lors de la récupération des rooms:", err);
            setError(err instanceof Error ? err.message : "Erreur inconnue");
        } finally {
            setLoading(false);
        }
    };

    const handleRoomSelection = (roomName: string) => {
        setSelectedRoomName(roomName);
        setMessages([]);
        socket.joinRoom(roomName);
    };

    useEffect(() => {
        fetchRooms();
    }, []);

    const createMessageKey = useCallback(
        (message: Message) =>
            `${message.dateEmis}-${message.pseudo}-${message.content}`,
        []
    );

    const isMessageDuplicate = useCallback(
        (newMessage: Message, existingMessages: Message[]) => {
            const newKey = createMessageKey(newMessage);
            return existingMessages.some(
                (msg) => createMessageKey(msg) === newKey
            );
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
            console.log("Envoi du message:", newMessage);
            setNewMessage("");
        }
    };

    const handleCreateRoom = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();
        if (newRoomName.trim()) {
            socket.joinRoom(newRoomName.trim());
            setNewRoomName("");
            await fetchRooms();
            setSelectedRoomName(newRoomName.trim());
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
                        <Modal
                            trigger={
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        setIsCreateRoomModalOpen(true)
                                    }
                                >
                                    +
                                </Button>
                            }
                            title="Créer une nouvelle conversation"
                            content={
                                <form onSubmit={handleCreateRoom}>
                                    <input
                                        type="text"
                                        value={newRoomName}
                                        onChange={(e) =>
                                            setNewRoomName(e.target.value)
                                        }
                                        placeholder="Nom de la conversation"
                                        className="border border-gray-300 rounded p-2 w-full"
                                        required
                                    />
                                    <Button
                                        type="submit"
                                        className="mt-2"
                                        disabled={!newRoomName.trim()}
                                    >
                                        Créer
                                    </Button>
                                </form>
                            }
                            isOpen={isCreateRoomModalOpen}
                            onOpenChange={setIsCreateRoomModalOpen}
                        />
                    </div>
                    {error && (
                        <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
                            <div className="flex items-center justify-between">
                                <span>Erreur: {error}</span>
                                <Button
                                    onClick={fetchRooms}
                                    variant="outline"
                                    size="sm"
                                    className="ml-2"
                                >
                                    Réessayer
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto">
                    {(() => {
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

                        if (rooms.length === 0) {
                            return (
                                <div className="flex items-center justify-center p-8">
                                    <p className="text-gray-500">
                                        Aucune conversation disponible
                                    </p>
                                </div>
                            );
                        }

                        return rooms.map((room) => (
                            <button
                                key={room.name}
                                onClick={() => handleRoomSelection(room.name)}
                                className={`w-full text-left p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                                    selectedRoomName === room.name
                                        ? "bg-blue-50 border-l-4 border-l-blue-500"
                                        : ""
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="text-2xl">
                                        {room.avatar}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-medium text-gray-900 truncate">
                                                {decodeURIComponent(room.name)}
                                            </h3>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ));
                    })()}
                </div>
            </aside>

            <main className="flex-1 flex flex-col">
                {selectedRoom ? (
                    <>
                        <div className="bg-white border-b border-gray-200 p-4">
                            <div className="flex items-center space-x-3">
                                <div className="text-2xl">
                                    {selectedRoom.avatar}
                                </div>
                                <div>
                                    <h1 className="font-semibold text-gray-900">
                                        {decodeURIComponent(selectedRoom.name)}
                                    </h1>
                                    <p className="text-sm text-gray-500">
                                        En ligne
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map((message, index) => {
                                // Messages du serveur
                                if (message.pseudo === "SERVER") {
                                    return (
                                        <div
                                            key={
                                                message.id ||
                                                `${message.pseudo}-${message.dateEmis}-${index}`
                                            }
                                            className="flex justify-center"
                                        >
                                            <p className="text-xs text-gray-400 italic">
                                                {message.content}
                                            </p>
                                        </div>
                                    );
                                }

                                // Messages des utilisateurs
                                return (
                                    <div
                                        key={
                                            message.id ||
                                            `${message.pseudo}-${message.dateEmis}-${index}`
                                        }
                                        className={`flex ${
                                            message.pseudo === user?.username
                                                ? "justify-end"
                                                : "justify-start"
                                        }`}
                                    >
                                        <div
                                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                                message.pseudo ===
                                                user?.username
                                                    ? "bg-blue-500 text-white"
                                                    : "bg-white border border-gray-200 text-gray-900"
                                            }`}
                                        >
                                            {message.pseudo !==
                                                user?.username && (
                                                <p className="text-xs font-medium mb-1 text-gray-600">
                                                    {message.pseudo}
                                                </p>
                                            )}
                                            {message.imageUrl ? (
                                                <div className="mt-1">
                                                    <img
                                                        src={message.imageUrl}
                                                        alt="Contenu visuel"
                                                        className="max-w-xs rounded-lg"
                                                    />
                                                </div>
                                            ) : (
                                                <p className="text-sm">
                                                    {message.content}
                                                </p>
                                            )}
                                            <p
                                                className={`text-xs mt-1 ${
                                                    message.pseudo ===
                                                    user?.username
                                                        ? "text-blue-100"
                                                        : "text-gray-500"
                                                }`}
                                            >
                                                {formatTime(message.dateEmis)}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                            {/* Élément invisible pour l'auto-scroll */}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="bg-white border-t border-gray-200 p-4">
                            <div className="flex space-x-2">
                                <Input
                                    value={newMessage}
                                    onChange={(e) =>
                                        setNewMessage(e.target.value)
                                    }
                                    placeholder="Tapez votre message..."
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            handleSendMessage();
                                        }
                                    }}
                                    className="flex-1"
                                />
                                <Button
                                    onClick={startCamera}
                                    variant="outline"
                                    size="icon"
                                    title="Prendre une photo"
                                >
                                    <svg
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            d="M9 3H15L17 5H21C21.5304 5 22.0391 5.21071 22.4142 5.58579C22.7893 5.96086 23 6.46957 23 7V19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V7C1 6.46957 1.21071 5.96086 1.58579 5.58579C1.96086 5.21071 2.46957 5 3 5H7L9 3Z"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                        <circle
                                            cx="12"
                                            cy="13"
                                            r="4"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </Button>
                                <Button
                                    onClick={handleSendMessage}
                                    disabled={!newMessage.trim()}
                                >
                                    Envoyer
                                </Button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-gray-500">
                            Sélectionnez une conversation pour commencer
                        </p>
                    </div>
                )}

                {/* Interface de la caméra */}
                {isCameraOpen && (
                    <div className="fixed inset-0 bg-opacity-75 flex items-center justify-center z-50">
                        <div className="bg-gray-900 rounded-lg p-4 max-w-md w-full mx-4">
                            <div className="text-center">
                                <h3 className="text-lg font-semibold mb-4">
                                    {(() => {
                                        if (capturedImage) return "Photo capturée";
                                        if (cameraLoading) return "Initialisation de la caméra...";
                                        return "Prendre une photo";
                                    })()}
                                </h3>
                                
                                {!capturedImage && (
                                    <div className="relative">
                                        {cameraLoading && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-lg z-10">
                                                <div className="text-center">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                                                    <span className="ml-2 text-white">Chargement de la caméra...</span>
                                                </div>
                                            </div>
                                        )}
                                        <video
                                            ref={videoRef}
                                            autoPlay
                                            playsInline
                                            muted
                                            className="w-full rounded-lg bg-gray-100"
                                            style={{ minHeight: '200px' }}
                                            onLoadedMetadata={() => {
                                                console.log("Métadonnées vidéo chargées");
                                                setCameraLoading(false);
                                            }}
                                            onCanPlay={() => {
                                                console.log("Vidéo prête à jouer");
                                                setCameraLoading(false);
                                            }}
                                            onPlaying={() => {
                                                console.log("Vidéo en cours de lecture");
                                                setCameraLoading(false);
                                            }}
                                            onError={(e) => {
                                                console.error("Erreur vidéo:", e);
                                                setCameraLoading(false);
                                                alert("Erreur lors du chargement de la vidéo");
                                            }}
                                        />
                                        <canvas
                                            ref={canvasRef}
                                            className="hidden"
                                        />
                                        <div className="flex justify-center space-x-2 mt-4">
                                            <Button
                                                onClick={capturePhoto}
                                                className="bg-blue-500 hover:bg-blue-600"
                                            >
                                                📸 Capturer
                                            </Button>
                                            <Button
                                                onClick={stopCamera}
                                                variant="outline"
                                            >
                                                Annuler
                                            </Button>
                                        </div>
                                    </div>
                                )}
                                
                                {capturedImage && (
                                    <div>
                                        <div className="relative">
                                            <img
                                                src={capturedImage}
                                                alt="Aperçu"
                                                className="w-full rounded-lg"
                                            />
                                        </div>
                                        <div className="flex justify-center space-x-2 mt-4">
                                            <Button
                                                onClick={sendPhoto}
                                                className="bg-green-500 hover:bg-green-600"
                                            >
                                                📤 Envoyer
                                            </Button>
                                            <Button
                                                onClick={retakePhoto}
                                                variant="outline"
                                            >
                                                🔄 Reprendre
                                            </Button>
                                            <Button
                                                onClick={stopCamera}
                                                variant="outline"
                                            >
                                                Annuler
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
