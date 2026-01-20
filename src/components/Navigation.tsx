"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Navigation() {
  const { isAuthenticated, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/connexion");
  };

  return (
    <nav className="flex gap-4 justify-between w-full">
      <Link href="/">Home</Link>
      {!isAuthenticated ? (
        <Link href="/connexion">Connexion</Link>
      ) : (
        <div className="flex items-center gap-4">
          <Link href="/chat">Chat</Link>
          <Link href="/gallery">Gallery</Link>
          <Link href="/room">Room</Link>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Déconnexion
          </Button>
        </div>
      )}
    </nav>
  );
}
