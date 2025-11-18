import React, { KeyboardEvent, useState, useRef } from "react";
import { X, Tag as TagIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { CopyableText } from "./copyable-text";

interface TagInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  id?: string;
  className?: string;
  label?: string;
  onValidate?: (value: string) => string | false;
  error?: string;
}

export function TagInput({
  value,
  onChange,
  placeholder = "Type and press Enter to add phone numbers...",
  id,
  className,
  label,
  onValidate,
  error,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(value.length);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { i18n } = useTranslation("Dashboard");
  const { t: errorT } = useTranslation("Errors");
  const isRTL = i18n.language !== "en";

  // const validateIraqiPhoneNumber = (value: string) => {
  //   // Remove any non-digit characters
  //   const cleanNumber = value.replace(/\D/g, "");

  //   // Check if number starts with 0 and has exactly 11 digits
  //   if (!cleanNumber.startsWith("0") || cleanNumber.length !== 11) {
  //     return false;
  //   }

  //   return cleanNumber;
  // };

  const formatDisplayNumber = (value: string) => {
    try {
      const url = new URL(value);
      if (
        url.hostname.includes("youtube.com") ||
        url.hostname.includes("youtu.be")
      ) {
        const params = new URLSearchParams(url.search);
        const channelName = params.get("ab_channel") || "YouTube";
        return `youtube: ${channelName}`;
      }
      return value;
    } catch {
      return value;
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (inputValue.trim()) {
        const validatedValue = onValidate
          ? onValidate(inputValue.trim())
          : inputValue.trim();

        if (validatedValue) {
          const newTags = [...value];
          newTags.splice(cursorPosition, 0, validatedValue);
          onChange(newTags);
          setInputValue("");
          setCursorPosition(cursorPosition + 1);
        }
      }
    } else if (e.key === "Tab") {
      if (inputValue.trim()) {
        e.preventDefault();
        const validatedValue = onValidate
          ? onValidate(inputValue.trim())
          : inputValue.trim();

        if (validatedValue) {
          const newTags = [...value];
          newTags.splice(cursorPosition, 0, validatedValue);
          onChange(newTags);
          setInputValue("");
          setCursorPosition(cursorPosition + 1);
        }
      }
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      e.preventDefault();
      const newTags = [...value];
      newTags.splice(cursorPosition - 1, 1);
      onChange(newTags);
      setCursorPosition(Math.max(0, cursorPosition - 1));
    } else if (e.key === "ArrowLeft") {
      if (!inputValue) {
        setCursorPosition(Math.max(0, cursorPosition - 1));
      }
      const container = scrollContainerRef.current;
      if (container) {
        container.scrollLeft -= 100;
      }
    } else if (e.key === "ArrowRight") {
      if (!inputValue) {
        setCursorPosition(Math.min(value.length, cursorPosition + 1));
      }
      const container = scrollContainerRef.current;
      if (container) {
        container.scrollLeft += 100;
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  const removeTag = (index: number) => {
    const newTags = value.filter((_, i) => i !== index);
    onChange(newTags);
    if (index < cursorPosition) {
      setCursorPosition(cursorPosition - 1);
    }
  };

  const handleTagClick = (index: number) => {
    setCursorPosition(index);
    inputRef.current?.focus();
  };

  return (
    <div className="w-full space-y-2">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <div
        className={cn(
          "group relative flex items-center w-full rounded-md border border-input bg-background text-sm ring-offset-background transition-all duration-300 min-h-[100px]",
          "focus-within:outline-none focus-within:ring-1 focus-within:ring-primary focus-within:border-primary",
          "hover:border-primary/50 cursor-text shadow-sm",
          error && "border-destructive focus-within:ring-destructive/50",
          className
        )}
        onClick={() => inputRef.current?.focus()}
      >
        <div
          ref={scrollContainerRef}
          className={cn(
            "flex flex-wrap items-start gap-2 p-3 w-full overflow-y-auto scrollbar-none"
          )}
        >
          {value.length === 0 && !isFocused && !inputValue && (
            <div
              className={cn(
                "absolute left-3 top-3 flex items-center gap-2 text-muted-foreground/70 pointer-events-none transition-opacity duration-200",
                isRTL ? "right-3" : "left-3",
                (isFocused || inputValue) && "opacity-0"
              )}
            >
              <TagIcon className="h-4 w-4" />
              <span>{placeholder}</span>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-1.5 w-full">
            {value.map((tag, index) => (
              <div key={index} className="flex items-center gap-1">
                <CopyableText
                  text={tag}
                  displayText={formatDisplayNumber(tag)}
                  className="py-1 px-2.5 rounded-full text-sm hover:bg-primary/15 bg-primary/10"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTag(index);
                  }}
                  className="hover:text-destructive focus:outline-none transition-colors rounded-full hover:bg-background/80 p-1 -ml-2"
                  aria-label={`Remove ${tag} tag`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <textarea
              ref={inputRef}
              id={id}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={value.length === 0 ? placeholder : ""}
              className="flex-1 border-0 bg-transparent p-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 min-h-[60px] resize-none"
              rows={2}
            />
          </div>
        </div>
      </div>
      {error && (
        <p className="text-sm text-destructive font-medium">{errorT(error)}</p>
      )}
    </div>
  );
}
