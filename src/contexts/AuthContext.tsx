"use client";

import React, {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

interface User {
    username: string;
    profileImage?: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (username: string, profileImage?: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);

    // Charger l'utilisateur depuis le localStorage au démarrage
    useEffect(() => {
        const savedUsername = localStorage.getItem("username");
        const savedProfileImage = localStorage.getItem("profileImage");

        if (savedUsername) {
            setUser({
                username: savedUsername,
                profileImage: savedProfileImage || undefined,
            });
        }
    }, []);

    const login = (username: string, profileImage?: string) => {
        const newUser = { username, profileImage };
        setUser(newUser);

        // Sauvegarder dans localStorage
        localStorage.setItem("username", username);
        if (profileImage) {
            localStorage.setItem("profileImage", profileImage);
        }
    };

    const logout = () => {
        setUser(null);

        // Supprimer du localStorage
        localStorage.removeItem("username");
        localStorage.removeItem("profileImage");
    };

    const value: AuthContextType = useMemo(
        () => ({
            user,
            isAuthenticated: !!user,
            login,
            logout,
        }),
        [user]
    );

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
};

// Hook personnalisé pour utiliser le contexte d'authentification
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
