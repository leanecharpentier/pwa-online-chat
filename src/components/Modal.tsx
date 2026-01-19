import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ModalProps {
  readonly trigger: React.ReactNode;
  readonly title?: string;
  readonly description?: string;
  readonly content?: React.ReactNode;
  readonly footer?: React.ReactNode;
  readonly isOpen?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
}

export function Modal({
  trigger,
  title,
  description,
  content,
  footer,
  isOpen,
  onOpenChange,
}: ModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <form>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          {content}
          <DialogFooter>{footer}</DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
