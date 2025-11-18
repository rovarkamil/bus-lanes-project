"use client";

import { Card } from "@/components/ui/card";

export interface SpecItem {
  label: string;
  value: string | number;
}

interface ItemSpecsProps {
  specs: SpecItem[];
  className?: string;
}

export function ItemSpecs({ specs, className }: ItemSpecsProps) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${className || ""}`}>
      {specs.map((spec, index) => (
        <Card key={index} className="p-4 bg-background border hover:shadow-sm transition-shadow">
          <p className="text-sm font-medium text-muted-foreground mb-1">{spec.label}</p>
          <p className="text-lg font-medium">{spec.value}</p>
        </Card>
      ))}
    </div>
  );
} 