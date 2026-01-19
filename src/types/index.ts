export interface Message {
  id?: string;
  content: string;
  categorie: string;
  dateEmis: string;
  roomName: string;
  pseudo: string;
  imageUrl?: string;
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
