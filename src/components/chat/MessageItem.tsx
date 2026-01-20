import { formatTime } from "@/lib/utils";
import type { Message, User } from "@/types";

interface MessageItemProps {
  message: Message;
  currentUser: User | null;
}

// Fonction pour convertir le texte avec URLs en éléments React cliquables
function renderTextWithLinks(text: string): React.ReactNode {
  // Regex pour détecter les URLs (http, https, ou www.)
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = urlRegex.exec(text)) !== null) {
    // Ajouter le texte avant l'URL
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    // Créer le lien cliquable
    let url = match[0];
    if (!url.startsWith("http")) {
      url = `https://${url}`;
    }

    parts.push(
      <a
        key={match.index}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:opacity-80 break-all"
      >
        {match[0]}
      </a>,
    );

    lastIndex = match.index + match[0].length;
  }

  // Ajouter le texte restant après la dernière URL
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  // Si aucune URL n'a été trouvée, retourner le texte original
  return parts.length > 0 ? parts : text;
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
  const isPending = message.isPending === true;

  return (
    <div className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isPending
            ? isOwnMessage
              ? "bg-gray-400 text-white opacity-60"
              : "bg-gray-100 border border-gray-300 text-gray-500 opacity-60"
            : isOwnMessage
              ? "bg-blue-500 text-white"
              : "bg-white border border-gray-200 text-gray-900"
        }`}
      >
        {!isOwnMessage && (
          <p
            className={`text-xs font-medium mb-1 ${
              isPending ? "text-gray-400" : "text-gray-600"
            }`}
          >
            {message.pseudo}
          </p>
        )}
        {isPending && isOwnMessage && (
          <p className="text-xs mb-1 text-gray-200 italic">
            En attente d&apos;envoi...
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
          <p className="text-sm whitespace-pre-wrap">
            {renderTextWithLinks(message.content)}
          </p>
        )}
        <p
          className={`text-xs mt-1 ${
            isPending
              ? isOwnMessage
                ? "text-gray-200"
                : "text-gray-400"
              : isOwnMessage
                ? "text-blue-100"
                : "text-gray-500"
          }`}
        >
          {formatTime(message.dateEmis)}
        </p>
      </div>
    </div>
  );
}
