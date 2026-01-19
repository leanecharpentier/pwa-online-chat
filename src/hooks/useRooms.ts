import { useEffect, useState } from "react";
import API from "@/lib/api";
import type { Room } from "@/types";

export function useRooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRooms = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await API.getRooms();
      const roomsData: Room[] = Object.keys(data.data).map((room, index) => ({
        name: room,
        avatar: ["💬", "👥", "🔧", "📝", "🎯"][index % 5],
      }));
      setRooms(roomsData);
    } catch (err) {
      console.error("Erreur lors de la récupération des rooms:", err);
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  return {
    rooms,
    loading,
    error,
    fetchRooms,
  };
}
