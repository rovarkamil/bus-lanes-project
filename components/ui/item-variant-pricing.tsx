"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ShoppingCart, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SpecItem } from "./item-specs";

export interface OptionType {
  id: string;
  name: string;
  values: OptionValueType[];
}

export interface OptionValueType {
  id: string;
  value: string;
  description?: string;
}

export interface QuantityBreakType {
  minQuantity: number;
  price: number;
}

export interface VariantType {
  id: string;
  optionValueIds: string[];
  quantityBreaks: QuantityBreakType[];
}

interface ItemVariantPricingProps {
  options: OptionType[];
  variants: VariantType[];
  className?: string;
  onSpecificationsChange?: (specs: SpecItem[]) => void;
}

export function ItemVariantPricing({
  options,
  variants,
  className,
  onSpecificationsChange,
}: ItemVariantPricingProps) {
  const [selectedOptionValues, setSelectedOptionValues] = useState<
    Record<string, string>
  >({});
  const [quantity, setQuantity] = useState<number>(100);
  const [isOpen, setIsOpen] = useState(true);
  const [localSpecs, setLocalSpecs] = useState<SpecItem[]>([
    { label: "Format", value: "85x55 mm" },
    { label: "Shipping", value: "Free shipping" },
  ]);

  // Find the matching variant based on selected options
  const selectedVariant = useMemo(() => {
    if (Object.keys(selectedOptionValues).length === 0) return null;

    const selectedIds = Object.values(selectedOptionValues);

    return variants.find((variant) => {
      const variantOptionIds = new Set(variant.optionValueIds);
      return selectedIds.every((id) => variantOptionIds.has(id));
    });
  }, [selectedOptionValues, variants]);

  // Get the current price based on quantity
  const currentPrice = useMemo(() => {
    if (!selectedVariant) return null;

    const { quantityBreaks } = selectedVariant;
    // Sort by minQuantity in descending order
    const sortedBreaks = [...quantityBreaks].sort(
      (a, b) => b.minQuantity - a.minQuantity
    );

    // Find the first break that quantity is greater than or equal to
    for (const qBreak of sortedBreaks) {
      if (quantity >= qBreak.minQuantity) {
        return qBreak.price;
      }
    }

    // If no matching break, use the lowest quantity break
    return (
      quantityBreaks.sort((a, b) => a.minQuantity - b.minQuantity)[0]?.price ||
      0
    );
  }, [selectedVariant, quantity]);

  // Get total price
  const totalPrice = useMemo(() => {
    if (currentPrice === null) return null;
    return currentPrice * quantity;
  }, [currentPrice, quantity]);

  // Calculate specifications based on selected options
  const specifications = useMemo(() => {
    const specs: SpecItem[] = [
      { label: "Format", value: "85x55 mm" }, // Default format
    ];

    // Add specs from selected options
    Object.entries(selectedOptionValues).forEach(([optionId, valueId]) => {
      const option = options.find((opt) => opt.id === optionId);
      const value = option?.values.find((val) => val.id === valueId);

      if (option && value) {
        specs.push({
          label: option.name,
          value: value.value,
        });
      }
    });

    // Add shipping spec
    specs.push({ label: "Shipping", value: "Free shipping" });

    return specs;
  }, [selectedOptionValues, options]);

  // Notify parent of specification changes
  useEffect(() => {
    if (onSpecificationsChange) {
      onSpecificationsChange(specifications);
    }
  }, [specifications, onSpecificationsChange]);

  // Handle option selection with useCallback to maintain reference stability
  const handleOptionChange = useCallback(
    (optionId: string, valueId: string) => {
      setSelectedOptionValues((prev) => ({
        ...prev,
        [optionId]: valueId,
      }));
    },
    []
  );

  // Handle quantity change with useCallback
  const handleQuantityChange = useCallback((value: string) => {
    const parsed = parseInt(value);
    if (!isNaN(parsed) && parsed > 0) {
      setQuantity(parsed);
    }
  }, []);

  // Increment/decrement quantity with useCallback
  const adjustQuantity = useCallback((amount: number) => {
    setQuantity((prev) => {
      const newValue = prev + amount;
      return newValue > 0 ? newValue : prev;
    });
  }, []);

  // Toggle open/closed state
  const toggleOpen = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return (
    <Card className={`p-0 border shadow-sm ${className || ""}`}>
      <div
        className="p-4 border-b flex justify-between items-center cursor-pointer"
        onClick={toggleOpen}
      >
        <h3 className="text-lg font-semibold">Customize Your Order</h3>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          {isOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>

      {isOpen && (
        <div className="p-4 space-y-6">
          {/* Options Selection */}
          {options.map((option) => (
            <div key={option.id} className="space-y-3">
              <h4 className="font-medium">{option.name}</h4>
              <RadioGroup
                onValueChange={(value) => handleOptionChange(option.id, value)}
                value={selectedOptionValues[option.id] || ""}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {option.values.map((value) => (
                    <div key={value.id} className="flex items-start gap-x-2">
                      <RadioGroupItem value={value.id} id={value.id} />
                      <div className="grid gap-1.5">
                        <Label htmlFor={value.id} className="font-medium">
                          {value.value}
                        </Label>
                        {value.description && (
                          <p className="text-sm text-muted-foreground">
                            {value.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>
          ))}

          {/* Quantity Selection */}
          <div className="space-y-3">
            <h4 className="font-medium">Quantity</h4>
            <div className="flex items-center">
              <Button
                variant="outline"
                className="h-10 rounded-r-none border-r-0"
                onClick={() => adjustQuantity(-100)}
              >
                -
              </Button>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => handleQuantityChange(e.target.value)}
                className="w-24 text-center rounded-none h-10 border-x-0"
                min={1}
              />
              <Button
                variant="outline"
                className="h-10 rounded-l-none border-l-0"
                onClick={() => adjustQuantity(100)}
              >
                +
              </Button>
            </div>
          </div>

          {/* Pricing Display */}
          <div className="border-t pt-4 mt-4">
            <div className="flex flex-col space-y-2">
              {selectedVariant ? (
                <>
                  <div className="flex justify-between text-sm">
                    <span>Unit Price:</span>
                    <span className="font-medium">
                      ${currentPrice?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Quantity:</span>
                    <span>{quantity}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                    <span>Total:</span>
                    <span>${totalPrice?.toFixed(2) || "0.00"}</span>
                  </div>

                  {/* Quantity Breaks */}
                  <div className="mt-4 bg-gray-50 p-3 rounded-md">
                    <h5 className="font-medium text-sm mb-2">
                      Quantity Breaks
                    </h5>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedVariant.quantityBreaks
                        .sort((a, b) => a.minQuantity - b.minQuantity)
                        .map((qBreak, idx) => (
                          <div
                            key={idx}
                            className={`text-xs p-2 rounded ${
                              quantity >= qBreak.minQuantity
                                ? "bg-green-50 border border-green-200"
                                : "bg-white border"
                            }`}
                          >
                            <div className="flex justify-between">
                              <span>{qBreak.minQuantity}+</span>
                              <span className="font-medium">
                                ${qBreak.price.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">
                    Please select all options to see pricing
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Add to Cart Button */}
          <Button
            className="w-full mt-4 bg-green-500 hover:bg-green-600 text-white"
            disabled={!selectedVariant}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Add to Cart
          </Button>
        </div>
      )}
    </Card>
  );
}
