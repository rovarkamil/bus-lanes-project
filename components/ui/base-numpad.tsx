import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FaBackspace } from "react-icons/fa";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/client";

interface BaseNumpadProps {
  onInput: (value: string) => void;
  onClose?: () => void;
  currentValue: string;
  allowDecimals?: boolean;
  customButtons?: string[];
  showConfirmButton?: boolean;
  inputClassName?: string;
  buttonClassName?: string;
  confirmButtonText?: string;
  inputReadOnly?: boolean;
}

export const BaseNumpad: React.FC<BaseNumpadProps> = ({
  onInput,
  onClose,
  currentValue,
  allowDecimals = false,
  customButtons,
  showConfirmButton = true,
  inputClassName = "",
  buttonClassName = "",
  confirmButtonText = "Confirm",
  inputReadOnly = true,
}) => {
  const [previewValue, setPreviewValue] = useState(currentValue);

  const defaultButtons = [
    "7",
    "8",
    "9",
    "4",
    "5",
    "6",
    "1",
    "2",
    "3",
    "Backspace",
    "0",
    allowDecimals ? "." : "Clear",
  ];

  const buttons = customButtons || defaultButtons;

  const handleButtonClick = useCallback(
    (value: string) => {
      if (value === "Clear") {
        setPreviewValue("0");
      } else if (value === "Backspace") {
        setPreviewValue((prev) => prev.slice(0, -1) || "0");
      } else if (value === "." && allowDecimals) {
        if (!previewValue.includes(".")) {
          setPreviewValue((prev) => prev + ".");
        }
      } else {
        setPreviewValue((prev) => {
          if (prev === currentValue || prev === "0") {
            return value;
          }
          return prev + value;
        });
      }
    },
    [currentValue, allowDecimals]
  );

  const handleConfirm = () => {
    onInput(previewValue);
    onClose?.();
  };

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const key = event.key;
      if (/^[0-9]$/.test(key)) {
        event.preventDefault();
        handleButtonClick(key);
      } else if (key === "Backspace") {
        event.preventDefault();
        handleButtonClick("Backspace");
      } else if (key === "." && allowDecimals) {
        event.preventDefault();
        handleButtonClick(".");
      } else if (key === "Enter" && onClose) {
        event.preventDefault();
        handleConfirm();
      }
    },
    [handleButtonClick, onClose, allowDecimals]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <div className="flex flex-col gap-4 px-1">
      <Input
        value={previewValue}
        readOnly={inputReadOnly}
        className={cn(
          "text-2xl font-semibold text-center h-12",
          inputClassName
        )}
      />

      <div className="grid grid-cols-3 gap-3">
        {buttons.map((btn, index) => (
          <Button
            key={index}
            onClick={() => handleButtonClick(btn)}
            className={cn(
              "text-xl font-semibold h-14 transition-all hover:scale-[0.98] active:scale-95",
              btn === "Clear" && "bg-red-500 hover:bg-red-600 text-white",
              btn === "Backspace" &&
                "bg-yellow-500 hover:bg-yellow-600 text-white",
              !["Clear", "Backspace"].includes(btn) &&
                "bg-blue-500 hover:bg-blue-600",
              buttonClassName
            )}
          >
            {btn === "Backspace" ? <FaBackspace className="h-6 w-6" /> : btn}
          </Button>
        ))}
      </div>

      {showConfirmButton && (
        <Button
          onClick={handleConfirm}
          className="bg-green-500 hover:bg-green-600 w-full h-14 text-xl font-semibold text-white transition-all hover:scale-[0.98] active:scale-95 mt-2"
        >
          {confirmButtonText}
        </Button>
      )}
    </div>
  );
};
