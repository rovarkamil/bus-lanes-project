import { Button } from "@/components/ui/button";
import { FileSpreadsheet } from "lucide-react";

interface ExportButtonProps {
  onClick: () => void;
  disabled?: boolean;
  t: (key: string) => string;
}

export const ExportButton = ({ onClick, disabled, t }: ExportButtonProps) => {
  return (
    <Button variant="outline" size="sm" onClick={onClick} disabled={disabled}>
      <FileSpreadsheet className="h-4 w-4 mr-2" />
      {t("Export")}
    </Button>
  );
};
