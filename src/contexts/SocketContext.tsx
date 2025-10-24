"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";

interface Message {
    content: string;
    categorie: string;
    dateEmis: string;
    roomName: string;
    pseudo: string;
}

interface SocketContextType {
    socket: Socket | null;
    currentRoomName: string;
    joinRoom: (roomName: string) => void;
    sendMessage: (message: string) => void;
    getMessages: (callback: (data: Message) => void) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [currentRoomName, setCurrentRoomName] = useState<string>("");
    const { user } = useAuth();

    useEffect(() => {
        const newSocket = io("https://api.tools.gavago.fr", {
            transports: ["websocket"],
            autoConnect: true,
        });

        newSocket.on("connect", () => {
            console.log("Connecté au serveur Socket.io");
        });

        newSocket.on("disconnect", () => {
            console.log("Déconnecté du serveur Socket.io");
        });

        setSocket(newSocket);
        return () => {
            newSocket.disconnect();
        };
    }, []);

    const joinRoom = useCallback(
        (roomName: string) => {
            if (socket) {
                setCurrentRoomName(roomName);
                socket.emit("chat-join-room", {
                    pseudo: user?.username,
                    roomName,
                });
                console.log(
                    `${user?.username} a rejoint la salle: ${roomName}`
                );
            }
        },
        [socket, user?.username]
    );

    const sendMessage = useCallback(
        (message: string) => {
            if (socket && currentRoomName) {
                socket.emit("chat-msg", {
                    content: message,
                    roomName: currentRoomName,
                });
            }
        },
        [socket, currentRoomName]
    );

    const getMessages = useCallback(
        (callback: (data: Message) => void) => {
            if (socket) {
                socket.on("chat-msg", (data: Message) => {
                    callback(data);
                });
            }
        },
        [socket]
    );

    const contextValue = useMemo(
        () => ({
            socket,
            currentRoomName,
            joinRoom,
            sendMessage,
            getMessages,
        }),
        [socket, currentRoomName, joinRoom, sendMessage, getMessages]
    );

    return (
        <SocketContext.Provider value={contextValue}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error("useSocket must be used within a SocketProvider");
    }
    return context;
};
