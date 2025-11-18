/* eslint-disable-next-line @zohodesk/no-hardcoding/no-hardcoding */
"use client";

import { cn } from "@/lib/utils";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface CopyableTextProps {
  text: string;
  displayText?: string;
  className?: string;
  price?: number;
}

export function CopyableText({
  text,
  displayText,
  className,
  price,
}: CopyableTextProps) {
  const { t } = useTranslation("Common");
  const [isCopied, setIsCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      toast.success(t("Copied"));
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error(t("CopyFailed"));
      }
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 cursor-pointer group",
        "px-3 py-1.5 rounded-md transition-all duration-200",
        "bg-secondary/80 hover:bg-secondary",
        isHovered && "text-primary",
        isCopied && "bg-green-500/10 text-green-500 hover:bg-green-500/20",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCopy}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-center gap-2 flex-grow">
        <span className="transition-all duration-200">
          {displayText || text}
        </span>
        {price !== undefined && (
          <span className="text-sm text-muted-foreground">
            ( {Number(price).toLocaleString()})
          </span>
        )}
      </div>
      <div className="flex items-center transition-all duration-200">
        {isCopied ? (
          <Check className="w-4 h-4 animate-in fade-in-10 zoom-in-0" />
        ) : (
          <Copy className={cn("w-4 h-4", !isHovered && "opacity-50")} />
        )}
      </div>
    </div>
  );
}
