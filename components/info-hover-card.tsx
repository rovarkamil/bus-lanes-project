import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Info } from "lucide-react";
import { JsonValue } from "@prisma/client/runtime/library";

interface InfoHoverCardProps {
  title: string;
  content?: JsonValue | null;
}

const formatContent = (content: JsonValue | null | undefined): string => {
  if (content === null || content === undefined) {
    return "No content provided";
  }

  if (typeof content === "object") {
    try {
      // First parse the content if it's a stringified JSON
      const parsed =
        typeof content === "string" ? JSON.parse(content) : content;

      // Format the object for display
      const formatted = Object.entries(parsed)
        .map(([key, value]) => {
          // Handle nested objects and arrays
          const formattedValue =
            typeof value === "object" && value !== null
              ? JSON.stringify(value, null, 2)
              : String(value).replace(/\\n/g, "\n").replace(/\\"/g, '"');

          return `${key}: ${formattedValue}`;
        })
        .join("\n");

      return formatted;
    } catch {
      // If JSON parsing fails, try to clean up the string representation
      const cleanString = JSON.stringify(content, null, 2)
        .replace(/\\n/g, "\n")
        .replace(/\\"/g, '"')
        .replace(/^"|"$/g, ""); // Remove surrounding quotes
      return cleanString;
    }
  }

  // For primitive values
  return String(content).replace(/\\n/g, "\n").replace(/\\"/g, '"');
};

export const InfoHoverCard = ({ title, content }: InfoHoverCardProps) => {
  return (
    <HoverCard>
      <HoverCardTrigger>
        <Info
          className={`h-4 w-4 cursor-help  ${
            content ? "text-primary" : "text-muted-foreground"
          }`}
        />
      </HoverCardTrigger>
      <HoverCardContent
        className="whitespace-pre-wrap max-w-sm bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75"
        side="bottom"
      >
        <p className="font-medium">{title}</p>
        <p className="mt-2 text-sm font-mono">{formatContent(content)}</p>
      </HoverCardContent>
    </HoverCard>
  );
};
