"use client";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { useState } from "react";

export default function Page() {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setSelectedImage(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    return (
        <Card className="w-full max-w-sm m-auto">
            <CardHeader>
                <CardTitle>Se connecter à votre compte</CardTitle>
            </CardHeader>
            <CardContent>
                <form>
                    <div className="flex flex-col gap-6">
                        <div className="grid gap-2">
                            <div className="flex justify-center mb-4">
                                {selectedImage ? (
                                    <Image
                                        src={selectedImage}
                                        alt="Prévisualisation"
                                        width={96}
                                        height={96}
                                        className="w-24 h-24 object-cover rounded-full border-2 border-gray-200"
                                    />
                                ) : (
                                    <div className="w-24 h-24 rounded-full border-2 border-gray-300 flex items-center justify-center bg-gray-50">
                                        <svg
                                            className="w-8 h-8 text-gray-400"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                            />
                                        </svg>
                                    </div>
                                )}
                            </div>
                            <Label htmlFor="picture">Photo de profil</Label>
                            <Input
                                id="picture"
                                type="file"
                                placeholder="Choisis une photo de profil"
                                accept="image/*"
                                onChange={handleImageChange}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="username">
                                Nom d&#39;utilisateur
                            </Label>
                            <Input
                                id="username"
                                type="text"
                                placeholder="username"
                                required
                            />
                        </div>
                    </div>
                </form>
            </CardContent>
            <CardFooter className="flex-col gap-2">
                <Button type="submit" className="w-full">
                    Se connecter
                </Button>
            </CardFooter>
        </Card>
    );
}
