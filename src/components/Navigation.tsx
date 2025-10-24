"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

export default function Navigation() {
    const { isAuthenticated, logout } = useAuth();

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
                    <Button variant="outline" size="sm" onClick={logout}>
                        Déconnexion
                    </Button>
                </div>
            )}
        </nav>
    );
}
