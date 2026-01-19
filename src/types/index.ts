export interface Message {
  id?: string;
  content: string;
  categorie: string; // "MESSAGE" | "INFO" | "NEW_IMAGE" selon la doc
  dateEmis: string;
  roomName: string;
  pseudo?: string; // Pour compatibilité avec l'ancien code
  userId?: string; // Identifiant de l'utilisateur (format API)
  serverId?: string; // Identifiant du serveur
  imageUrl?: string; // URL de l'image pour l'affichage (généré côté client)
  imageId?: string; // Pour compatibilité
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
