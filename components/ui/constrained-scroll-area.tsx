import { ScrollArea } from "@/components/ui/scroll-area";
import { ComponentProps } from "react";

interface ConstrainedScrollAreaProps extends ComponentProps<typeof ScrollArea> {
  maxHeight?: string | number;
}

export function ConstrainedScrollArea({
  maxHeight,
  className,
  children,
  ...props
}: ConstrainedScrollAreaProps) {
  return (
    <ScrollArea className={className} {...props}>
      <div style={{ maxHeight }} className="h-full">
        {children}
      </div>
    </ScrollArea>
  );
}
