import React, {
  useState,
  useEffect,
  ChangeEvent,
  useRef,
  useCallback,
  forwardRef,
} from "react";
import { Input } from "./ui/input";
import { cn } from "@/lib/utils";

const formatNumberBase = (num: string, limitToTwoDecimals: boolean): string => {
  if (num === "" || isNaN(Number(num))) {
    return "";
  }
  const [integerPart, decimalPart] = num.split(".");
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  if (decimalPart !== undefined) {
    const formattedDecimal = limitToTwoDecimals
      ? decimalPart.slice(0, 2)
      : decimalPart;
    return `${formattedInteger}.${formattedDecimal}`;
  }
  return formattedInteger;
};

interface NumberInputWithCommasProps {
  className?: string;
  defaultValue?: number;
  value?: number;
  placeholder?: string;
  onChange?: (value: number) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  max?: number;
  min?: number;
  limitToTwoDecimals?: boolean;
  suffix?: string;
}

export const NumberInputWithCommas = forwardRef<
  HTMLInputElement,
  NumberInputWithCommasProps
>(
  (
    {
      defaultValue = 0,
      value,
      placeholder,
      onChange,
      onBlur,
      disabled,
      max,
      min = 0,
      className,
      limitToTwoDecimals = false,
      suffix,
    },
    ref
  ) => {
    const innerRef = useRef<HTMLInputElement>(null);
    const actualRef = (ref as React.RefObject<HTMLInputElement>) || innerRef;

    const formatNumber = useCallback(
      (num: string) => formatNumberBase(num, limitToTwoDecimals),
      [limitToTwoDecimals]
    );

    const initialNumber =
      value !== undefined
        ? formatNumber(value.toString())
        : formatNumber(defaultValue.toString());
    const [number, setNumber] = useState(initialNumber);

    useEffect(() => {
      if (value !== undefined) {
        setNumber(formatNumber(value.toString()));
      }
    }, [value, formatNumber]);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      const cursorPosition = e.target.selectionStart;
      const previousValue = e.target.value;
      const rawValue = e.target.value.replace(/,/g, "");

      // Allow empty input, single dot, or valid number with optional decimal
      if (
        rawValue === "" ||
        rawValue === "." ||
        /^-?\d*\.?\d*$/.test(rawValue)
      ) {
        // Don't convert to number yet if it's a dot or ends with dot
        const shouldParseNumber = rawValue !== "." && !rawValue.endsWith(".");
        let numericValue = shouldParseNumber ? parseFloat(rawValue) || 0 : 0;

        // Enforce min and max values during input
        if (shouldParseNumber) {
          if (min !== undefined && numericValue < min) {
            numericValue = min;
          }
          if (max !== undefined && numericValue > max) {
            numericValue = max;
          }
        }

        // Use raw value for display if it's a dot or ends with dot
        const displayValue = shouldParseNumber
          ? numericValue.toString()
          : rawValue;
        const formattedValue = formatNumber(displayValue);
        setNumber(formattedValue);

        if (onChange && shouldParseNumber) {
          onChange(numericValue);
        }

        setTimeout(() => {
          if (actualRef.current) {
            if (rawValue === "") {
              actualRef.current.setSelectionRange(1, 1);
            } else {
              const addedCommas =
                (formattedValue.match(/,/g) || []).length -
                (previousValue.match(/,/g) || []).length;
              const newPosition = (cursorPosition as number) + addedCommas;
              actualRef.current.setSelectionRange(newPosition, newPosition);
            }
          }
        }, 0);
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const rawValue = e.target.value.replace(/,/g, "");
      let numericValue = parseFloat(rawValue) || 0;

      // Enforce min and max values on blur
      if (min !== undefined && numericValue < min) {
        numericValue = min;
        setNumber(formatNumber(numericValue.toString()));
        if (onChange) {
          onChange(numericValue);
        }
      }
      if (max !== undefined && numericValue > max) {
        numericValue = max;
        setNumber(formatNumber(numericValue.toString()));
        if (onChange) {
          onChange(numericValue);
        }
      }

      if (onBlur) {
        onBlur(e);
      }
    };

    return (
      <div className="relative w-full" dir={"ltr"}>
        <Input
          ref={actualRef}
          className={cn(className, suffix && "pr-12")}
          type="text"
          value={number}
          max={max}
          min={min}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={placeholder}
        />
        {suffix && (
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-sm font-medium text-muted-foreground">
            {suffix}
          </div>
        )}
      </div>
    );
  }
);

NumberInputWithCommas.displayName = "NumberInputWithCommas";
