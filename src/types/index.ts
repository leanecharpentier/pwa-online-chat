export type MessageCategory = "MESSAGE" | "INFO" | "NEW_IMAGE";

export interface Message {
  id?: string;
  content: string;
  categorie: MessageCategory;
  dateEmis: string;
  roomName: string;
  pseudo?: string;
  userId?: string;
  serverId?: string;
  imageUrl?: string;
  imageId?: string;
  isPending?: boolean;
  tempId?: string;
}

export interface Room {
  name: string;
  avatar: string;
}

export interface PhotoData {
  id: string;
  imageUrl: string;
  dateEmis: string;
  roomName: string;
  pseudo: string;
}

export interface User {
  username: string;
  profileImage?: string;
}
