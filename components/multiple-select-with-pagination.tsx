/* eslint-disable @typescript-eslint/no-explicit-any */
import { FC, useState, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { UseQueryResult } from "@tanstack/react-query";
import Image from "next/image";
import { useTranslation } from "@/i18n/client";
import { Loader } from "./loader";

interface Field {
  key: string;
  label: string;
  // eslint-disable-next-line @zohodesk/no-hardcoding/no-hardcoding
  type?: "string" | "number" | "boolean" | "date" | "relation";
  relationKey?: string;
}

interface SelectWithPaginationProps {
  fetchFunction: (options?: any) =>
    | UseQueryResult<any, Error>
    | {
        data: any;
        isLoading: boolean;
        error: Error | null;
        refetch: () => void;
      };
  onSelect: (items: any[]) => void;
  fields: Field[];
  imageField?: string;
  placeholder?: string;
  value?: (string | number)[];
  initialSelectedItems?: any[];
  getItemById?: (id: string | number) => Promise<any>;
  defaultValue?: any[];
  onValueChange?: (value: any[]) => void;
  params?: Record<string, unknown>;
  select?: string;
}

const MultipleSelectWithPagination: FC<SelectWithPaginationProps> = ({
  fetchFunction,
  onSelect,
  fields,
  imageField,
  placeholder = "Select items",
  value,
  params,
  select,
  initialSelectedItems,
  getItemById,
  defaultValue,
}) => {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [currentSearch, setCurrentSearch] = useState("");
  const [searchField, setSearchField] = useState(fields[0].key);
  const { t, i18n } = useTranslation("Common");

  const {
    data: items,
    isLoading,
    error,
    refetch,
  } = fetchFunction({
    ...params,
    ...(select ? { select } : {}),
    ...(currentSearch ? { [searchField]: currentSearch } : {}),
    page,
    limit: 10,
  });

  // Update the initialization effect to handle re-renders better
  useEffect(() => {
    const initializeValue = async () => {
      let initialValues: any[] = [];

      if (defaultValue && defaultValue.length > 0) {
        initialValues = defaultValue;
      } else if (initialSelectedItems && initialSelectedItems.length > 0) {
        initialValues = initialSelectedItems;
      } else if (value && value.length > 0) {
        if (getItemById) {
          try {
            const items = await Promise.all(value.map((v) => getItemById(v)));
            initialValues = items.filter((item) => item !== null);
          } catch (error) {
            console.error("Error fetching item details:", error);
          }
        } else if (items) {
          const dataArray =
            items?.items || items?.data?.data || items?.data || [];
          initialValues = dataArray.filter((item: any) =>
            value.includes(item.id)
          );
        }
      }

      if (initialValues.length > 0) {
        setSelectedItems(initialValues);
      }
    };

    initializeValue();
  }, [defaultValue, initialSelectedItems, value, getItemById, items]);

  // Handle item selection
  const handleSelectItem = useCallback(
    (item: any) => {
      setSelectedItems((prev) => {
        const isSelected = prev.some((i) => i.id === item.id);
        const newItems = isSelected
          ? prev.filter((i) => i.id !== item.id)
          : [...prev, item];
        onSelect(newItems);
        return newItems;
      });
    },
    [onSelect]
  );

  // Update the search handling to use debouncing
  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      setCurrentSearch(search);
      setPage(1);
      refetch();
    }, 600); // 1000ms debounce delay

    return () => clearTimeout(debounceTimeout);
  }, [search, refetch]);

  const totalPages =
    items?.totalPages ||
    items?.meta?.totalPages ||
    items?.pagination?.totalPages ||
    1;

  const normalizeValue = useCallback(
    (value: any): string | number | undefined => {
      if (value === null || value === undefined) return undefined;
      if (typeof value === "string" || typeof value === "number") return value;
      if (typeof value === "object") {
        const preferredOrder = [
          i18n.language,
          "en",
          "ar",
          "ckb",
          "name",
          "title",
        ];
        for (const key of preferredOrder) {
          if (value[key] && typeof value[key] === "string") {
            return value[key];
          }
        }
        const firstString = Object.values(value).find(
          (val) => typeof val === "string"
        );
        if (typeof firstString === "string") return firstString;
      }
      return undefined;
    },
    [i18n.language]
  );

  const getDisplayValue = useCallback(
    (items: any[]) => {
      if (!items.length) return placeholder;
      const key = items.length > 1 ? "items" : "item";
      return `${items.length} ${t(key)} ${t("selected")}`;
    },
    [placeholder, t]
  );

  // Add a function to render selected items
  const renderSelectedItems = useCallback(
    (items: any[]) => {
      if (!items.length) return null;

      return (
        <div className="flex flex-wrap gap-1 p-2 mt-2 border rounded-md bg-muted/20">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-1 px-2 py-1 text-sm rounded-md bg-primary/10 border"
            >
              {normalizeValue(item.name) ?? item.name ?? "Unknown"}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-destructive/20"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectItem(item);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      );
    },
    [handleSelectItem, normalizeValue]
  );

  const renderCellContent = (item: any, field: Field) => {
    if (field.type === "relation" && field.relationKey) {
      return (
        normalizeValue(item[field.key]?.[field.relationKey]) ??
        item[field.key]?.[field.relationKey] ??
        "N/A"
      );
    }
    if (field.key === "branch") {
      return item.branch?.name || "N/A";
    }
    return normalizeValue(item[field.key]) ?? item[field.key];
  };

  return (
    <div className="flex flex-col gap-1.5">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between relative"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                setOpen(true);
              }
            }}
          >
            {getDisplayValue(selectedItems)}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-fit p-2" side="bottom">
          <div className="space-y-2">
            <div className="flex items-center gap-x-1">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("Search")}
                className="flex-grow"
              />
              <Select value={searchField} onValueChange={setSearchField}>
                <SelectTrigger className="w-fit">
                  <SelectValue placeholder={t("Field")} />
                </SelectTrigger>
                <SelectContent>
                  {fields.map((field) => (
                    <SelectItem key={field.key} value={field.key}>
                      {field.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {isLoading ? (
              <Loader />
            ) : error ? (
              <div className="text-center text-red-500 p-1">
                Error: {error.message}
              </div>
            ) : (
              <ScrollArea className="h-fit w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {imageField && (
                        <TableHead className="w-10">Image</TableHead>
                      )}
                      {fields.map((field) => (
                        <TableHead key={field.key} className="h-8">
                          {field.label}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(
                      items?.items ||
                      items?.data?.data ||
                      items?.data ||
                      []
                    ).map((item: any) => (
                      <TableRow
                        key={item.id}
                        onClick={() => handleSelectItem(item)}
                        className={`cursor-pointer ${
                          selectedItems.some((i) => i.id === item.id)
                            ? "bg-input/10"
                            : ""
                        }`}
                      >
                        {imageField && (
                          <TableCell>
                            <Image
                              src={item[imageField] || "/images/no-image.jpg"}
                              alt={getDisplayValue(selectedItems)}
                              fill
                              className="rounded-sm"
                            />
                          </TableCell>
                        )}
                        {fields.map((field) => (
                          <TableCell key={field.key}>
                            {renderCellContent(item, field)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
            <div className={`flex  justify-between items-center text-sm`}>
              <Button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                type="button"
                size="icon"
                variant="ghost"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span>
                {t("Page")} {page} {t("of")} {totalPages}
              </span>
              <Button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                type="button"
                size="icon"
                variant="ghost"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      {renderSelectedItems(selectedItems)}
    </div>
  );
};

export default MultipleSelectWithPagination;
