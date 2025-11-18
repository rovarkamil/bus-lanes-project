import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface ConfirmationDialogProps {
  children: React.ReactNode;
  title: string;
  message: string;
  onConfirm: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: // eslint-disable-next-line @zohodesk/no-hardcoding/no-hardcoding
  | "default"
    // eslint-disable-next-line @zohodesk/no-hardcoding/no-hardcoding
    | "destructive"
    // eslint-disable-next-line @zohodesk/no-hardcoding/no-hardcoding
    | "outline"
    // eslint-disable-next-line @zohodesk/no-hardcoding/no-hardcoding
    | "secondary"
    // eslint-disable-next-line @zohodesk/no-hardcoding/no-hardcoding
    | "ghost"
    // eslint-disable-next-line @zohodesk/no-hardcoding/no-hardcoding
    | "link";
  isRtl?: boolean;
  disabled?: boolean;
}

export function ConfirmationDialog({
  children,
  title,
  message,
  onConfirm,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  isRtl = false,
  disabled = false,
}: ConfirmationDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent
        className={`grid ${isRtl ? "flex-row-reverse" : "flex-row"}`}
        dir={isRtl ? "rtl" : "ltr"}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={disabled}
            className={cn(
              variant === "destructive" &&
                // eslint-disable-next-line @zohodesk/no-hardcoding/no-hardcoding
                "bg-destructive text-destructive-foreground hover:bg-destructive/90"
            )}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
