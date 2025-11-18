import { Plus } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface CreateButtonProps {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const CreateButton = ({
  onClick,
  disabled,
  children,
  className,
}: CreateButtonProps) => {
  return (
    <Button
      className={cn(
        "relative group overflow-hidden rounded-2xl px-8 py-3",
        "bg-gradient-to-r from-primary via-primary/90 to-primary/80",
        "border-none",
        "shadow-lg shadow-primary/20 hover:shadow-primary/30",
        "transition-all duration-500 ease-out",
        className
      )}
      size="lg"
      onClick={onClick}
      disabled={disabled}
    >
      {/* Animated gradient overlay */}
      <span className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-transparent
        opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Shimmer effect */}
      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent
        translate-x-[-200%] group-hover:translate-x-[200%] duration-1000 transition-transform" />
      
      {/* Button content */}
      <span className="relative flex items-center gap-3 text-sm font-medium text-white">
        <Plus className="h-5 w-5 transition-transform duration-500 group-hover:rotate-[180deg]" />
        <span className="transition-all duration-500 group-hover:tracking-wider">
          {children}
        </span>
      </span>
      
      {/* Corner accents */}
      <span className="absolute top-0 left-0 h-10 w-10 border-t border-l border-white/20 
        rounded-tl-2xl group-hover:border-white/30 transition-colors duration-500" />
      <span className="absolute bottom-0 right-0 h-10 w-10 border-b border-r border-white/20 
        rounded-br-2xl group-hover:border-white/30 transition-colors duration-500" />
    </Button>
  );
}; 