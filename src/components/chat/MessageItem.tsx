import { formatTime } from "@/lib/utils";
import type { Message, User } from "@/types";

interface MessageItemProps {
  message: Message;
  currentUser: User | null;
}

export function MessageItem({ message, currentUser }: MessageItemProps) {
  // Messages du serveur
  if (message.pseudo === "SERVER") {
    return (
      <div className="flex justify-center">
        <p className="text-xs text-gray-400 italic">{message.content}</p>
      </div>
    );
  }

  const isOwnMessage = message.pseudo === currentUser?.username;

  return (
    <div className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isOwnMessage
            ? "bg-blue-500 text-white"
            : "bg-white border border-gray-200 text-gray-900"
        }`}
      >
        {!isOwnMessage && (
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
          <p className="text-sm">{message.content}</p>
        )}
        <p
          className={`text-xs mt-1 ${
            isOwnMessage ? "text-blue-100" : "text-gray-500"
          }`}
        >
          {formatTime(message.dateEmis)}
        </p>
      </div>
    </div>
  );
}
