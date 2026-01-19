import { useEffect, useRef } from "react";
import { MessageItem } from "./MessageItem";
import type { Message, User } from "@/types";

interface MessageListProps {
  messages: Message[];
  currentUser: User | null;
}

export function MessageList({ messages, currentUser }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message, index) => (
        <MessageItem
          key={
            message.id ||
            `${message.pseudo}-${message.dateEmis}-${index}`
          }
          message={message}
          currentUser={currentUser}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
