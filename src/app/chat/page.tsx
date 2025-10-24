"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import { formatTime } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";

interface Message {
    id?: string;
    content: string;
    categorie: string;
    dateEmis: string;
    roomName: string;
    pseudo: string;
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

    const socket = useSocket();
    const { user } = useAuth();

    const fetchRooms = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(
                "https://api.tools.gavago.fr/socketio/api/rooms"
            );

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            const data = await response.json();

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

    return (
        <div className="flex h-full bg-gray-50">
            <aside className="w-80 bg-white border-r border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-800">
                            Conversations
                        </h2>
                        <Button
                            onClick={fetchRooms}
                            disabled={loading}
                            variant="outline"
                            size="sm"
                        >
                            {loading ? "..." : "🔄"}
                        </Button>
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
                                            <p className="text-sm">
                                                {message.content}
                                            </p>
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
            </main>
        </div>
    );
}
