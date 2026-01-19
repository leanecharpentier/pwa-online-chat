import { Modal } from "@/components/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CreateRoomModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  roomName: string;
  onRoomNameChange: (name: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export function CreateRoomModal({
  isOpen,
  onOpenChange,
  roomName,
  onRoomNameChange,
  onSubmit,
}: CreateRoomModalProps) {
  return (
    <Modal
      trigger={
        <Button variant="outline" size="sm" onClick={() => onOpenChange(true)}>
          +
        </Button>
      }
      title="Créer une nouvelle conversation"
      content={
        <form onSubmit={onSubmit}>
          <Input
            type="text"
            value={roomName}
            onChange={(e) => onRoomNameChange(e.target.value)}
            placeholder="Nom de la conversation"
            className="w-full"
            required
          />
          <Button type="submit" className="mt-2" disabled={!roomName.trim()}>
            Créer
          </Button>
        </form>
      }
      isOpen={isOpen}
      onOpenChange={onOpenChange}
    />
  );
}
