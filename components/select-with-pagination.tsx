/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback, useEffect } from "react";
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
import { PaginatedResponse } from "@/types/models/common";
import { UseQueryResult } from "@tanstack/react-query";
import { Loader } from "./loader-table";
import Image from "next/image";
import { useTranslation } from "@/i18n/client";
import { cn } from "@/lib/utils";

interface Field {
  key: string;
  label: string;
  // eslint-disable-next-line @zohodesk/no-hardcoding/no-hardcoding
  type?: "string" | "number" | "boolean" | "date" | "relation";
  relationKey?: string;
  format?: (value: number) => string;
}

// Base interface for items that can be selected
interface SelectableItem {
  id: string | number;
  [key: string]: any;
}

interface SelectWithPaginationProps<
  TItem extends SelectableItem,
  TParams = Record<string, unknown>,
  TError = Error,
> {
  fetchFunction: (
    params?: TParams
  ) => UseQueryResult<PaginatedResponse<TItem>, TError>;
  onSelect: (item: TItem | null) => void;
  fields: Field[];
  imageField?: string;
  placeholder?: string;
  value?: string | number;
  initialSelectedItem?: TItem;
  getItemById?: (id: string | number) => Promise<TItem>;
  defaultValue?: TItem;
  disabled?: boolean;
  params?: TParams;
  fetchFunctionById?: (id: string | number) => UseQueryResult<TItem, TError>;
  canClear?: boolean;
  select?: string;
  userProvince?: string;
  branchProvince?: string;
  error?: string;
}

const SelectWithPagination = <
  TItem extends SelectableItem,
  TParams = Record<string, unknown>,
  TError = Error,
>({
  fetchFunction,
  onSelect,
  fields,
  imageField,
  placeholder = "Select an item",
  value,
  initialSelectedItem,
  getItemById,
  defaultValue,
  params,
  fetchFunctionById,
  canClear = false,
  select,
  userProvince,
  branchProvince,
  error,
}: SelectWithPaginationProps<TItem, TParams, TError>) => {
  const { t, i18n } = useTranslation("Dashboard");
  const { t: errorT } = useTranslation("Errors");
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState<TItem | null>(null);
  const [search, setSearch] = useState("");
  const [currentSearch, setCurrentSearch] = useState("");
  const [searchField, setSearchField] = useState(fields[0].key);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const isRTL = i18n.language !== "en";

  const {
    data: items,
    isLoading,
    error: fetchError,
    refetch,
  } = fetchFunction({
    ...params,
    page,
    limit: 5,
    ...(select ? { select } : {}),
    ...(currentSearch ? { [searchField]: currentSearch } : {}),
  } as TParams);

  // Update the getDisplayValue function to better handle different value types
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
    (item: TItem | null) => {
      if (!item) return placeholder;

      // If item is a string (id), show placeholder until we load the full object
      if (typeof item === "string" || typeof item === "number") {
        return placeholder;
      }

      const itemAsAny = item as any;

      const directName = normalizeValue(itemAsAny.name);
      if (directName) return directName;

      const provinceName = normalizeValue(itemAsAny.province?.name);
      if (provinceName) return provinceName;

      const branchName = normalizeValue(itemAsAny.branch?.name);
      if (branchName) return branchName;

      const userName = normalizeValue(itemAsAny.user?.name);
      if (userName) return userName;

      for (const field of fields) {
        if (field.type === "relation" && field.relationKey) {
          const value = normalizeValue(
            itemAsAny[field.key]?.[field.relationKey]
          );
          if (value) return value;
        } else {
          const value = normalizeValue(itemAsAny[field.key]);
          if (value) return value;
        }
      }

      return placeholder;
    },
    [fields, placeholder, normalizeValue]
  );

  // Update the initialization effect to properly set initial values
  useEffect(() => {
    const initializeValue = async () => {
      let initialValue: TItem | null = null;

      // Priority order: defaultValue > initialSelectedItem > value
      if (defaultValue) {
        // If defaultValue is just an ID, try to fetch the complete object
        if (
          typeof defaultValue === "string" ||
          typeof defaultValue === "number"
        ) {
          if (getItemById) {
            try {
              initialValue = await getItemById(defaultValue);
            } catch (error) {
              console.error("Error fetching item details:", error);
              // If fetch fails, use the ID as a fallback
              initialValue = defaultValue as TItem;
            }
          } else {
            initialValue = defaultValue;
          }
        } else {
          // If defaultValue is already a complete object
          initialValue = defaultValue;
        }
      } else if (initialSelectedItem) {
        initialValue = initialSelectedItem;
      } else if (value && getItemById) {
        try {
          initialValue = await getItemById(value);
        } catch (error) {
          console.error("Error fetching item details:", error);
          // If fetch fails, use the value as a fallback
          initialValue = null;
        }
      }

      if (initialValue) {
        setSelectedItem(initialValue);
      }
    };

    initializeValue();
  }, [defaultValue, initialSelectedItem, value, getItemById]);

  const response = fetchFunctionById
    ? fetchFunctionById(value as string | number)
    : null;

  useEffect(() => {
    if (response?.data) {
      setSelectedItem(response.data);
    }
  }, [response]);

  // Handle item selection
  const handleSelectItem = useCallback(
    (item: TItem) => {
      setSelectedItem(item);
      onSelect(item);
      setOpen(false);
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

  const renderCellContent = (item: TItem, field: Field) => {
    // Special handling for isMain field
    if (field.key === "isMain") {
      return (
        <span
          className={`
          inline-flex items-center justify-center
          px-2.5 py-0.5
          text-xs font-medium
          rounded-full
          transition-colors
          shadow-sm
          ${
            item[field.key]
              ? "bg-gradient-to-r from-amber-50 to-orange-100 text-amber-700 border border-amber-200/60"
              : "bg-gradient-to-r from-gray-50 to-gray-100 text-gray-600 border border-gray-200/60"
          }
        `}
        >
          <span
            className={`
            mr-1 h-1.5 w-1.5 rounded-full
            ${item[field.key] ? "bg-amber-500" : "bg-gray-400"}
          `}
          />
          {item[field.key] ? "Main" : "Branch"}
        </span>
      );
    }

    // Special handling for name fields with language support
    if (field.key === "name") {
      const localized = normalizeValue(item.name);
      if (localized) return localized;
      if (i18n.language === "en" && item.englishName) {
        return item.englishName;
      }
      return item.name;
    }

    // Special handling for address field
    if (field.key === "address") {
      if (typeof item.address === "object" && item.address !== null) {
        return item.address.address;
      }
      return item.address || "N/A";
    }

    // Get the base value for other fields
    let value;
    if (field.type === "relation" && field.relationKey) {
      value = normalizeValue(item[field.key]?.[field.relationKey]) || "N/A";
    } else {
      value = normalizeValue(item[field.key]) ?? item[field.key];
    }

    // Format the value if a format function is provided
    if (field.format && typeof value === "number") {
      return field.format(value);
    }

    // Only translate if this field has a type and the value matches the field's type
    if (field.key === "type") {
      const translatedValue = t(value, { defaultValue: value });
      value = translatedValue;
    }

    // Handle province prices display
    if (userProvince && item.userProvinces) {
      const provincePrice = item.userProvinces.find(
        (p: any) => p.provinceId === userProvince
      );
      if (provincePrice) {
        return (
          <div className="flex flex-col">
            <span>{value}</span>
            <span className="text-xs text-muted-foreground">
              {provincePrice.price}
            </span>
          </div>
        );
      }
    }

    if (branchProvince && item.branchProvinces) {
      const provincePrice = item.branchProvinces.find(
        (p: any) => p.provinceId === branchProvince
      );
      if (provincePrice) {
        return (
          <div className="flex flex-col">
            <span>{value}</span>
            <span className="text-xs text-muted-foreground">
              {provincePrice.price}
            </span>
          </div>
        );
      }
    }

    return value;
  };

  const totalPages = items?.totalPages || 1;

  // Add keyboard navigation handler
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!items?.items) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setFocusedIndex((prev) =>
            prev < items.items.length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;
        case "Enter":
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < items.items.length) {
            handleSelectItem(items.items[focusedIndex]);
          }
          break;
        case "Tab":
          // Allow natural tab navigation
          if (e.shiftKey && focusedIndex === -1) {
            setOpen(false);
          }
          break;
        case "Escape":
          setOpen(false);
          break;
      }
    },
    [items?.items, focusedIndex, handleSelectItem]
  );

  // Reset focused index when search changes
  useEffect(() => {
    setFocusedIndex(-1);
  }, [currentSearch]);

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent the popover from opening
      setSelectedItem(null);
      onSelect(null);
    },
    [onSelect]
  );

  return (
    <div className="w-full space-y-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full min-w-40 justify-between relative",
              error &&
                "border-destructive focus-visible:ring-destructive/50 hover:bg-destructive/10"
            )}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                setOpen(true);
              }
            }}
          >
            <span className="truncate">
              {isLoading && !selectedItem ? (
                <span className="flex items-center gap-2">
                  <Loader className="h-4 w-4" />
                  {t("Loading")}
                </span>
              ) : (
                getDisplayValue(selectedItem as TItem)
              )}
            </span>
            <div className="flex items-center gap-1">
              {canClear && selectedItem && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 p-0 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors duration-200 
                    focus:outline-none focus:ring-2 focus:ring-destructive/20 focus:ring-offset-1"
                  onClick={handleClear}
                  type="button"
                  title="Clear selection"
                >
                  <X className="h-3.5 w-3.5" />
                  <span className="sr-only">Clear selection</span>
                </Button>
              )}
              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
            </div>
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-fit p-2" side="bottom">
          <div className="space-y-2" onKeyDown={handleKeyDown}>
            <div className="flex items-center gap-x-1">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("Search")}
                className="flex-grow"
                // Add tab index to ensure it's the first focusable element
                tabIndex={open ? 0 : -1}
              />
              <Select value={searchField} onValueChange={setSearchField}>
                <SelectTrigger className="w-fit" tabIndex={open ? 0 : -1}>
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
            ) : fetchError ? (
              <div className="text-center text-red-500 p-1">
                {typeof fetchError === "object" &&
                fetchError !== null &&
                "message" in fetchError
                  ? t("Error") + ": " + fetchError.message
                  : t("AnErrorOccurred")}
              </div>
            ) : (
              <ScrollArea className="h-fit w-full">
                <Table>
                  <TableHeader>
                    <TableRow className="text-left">
                      {imageField && (
                        <TableHead className="w-10">{t("Image")}</TableHead>
                      )}
                      {fields.map((field) => (
                        <TableHead key={field.key} className="h-8 text-left">
                          {field.label}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items?.items.map((item: TItem, index: number) => (
                      <TableRow
                        key={item.id}
                        onClick={() => handleSelectItem(item)}
                        onFocus={() => setFocusedIndex(index)}
                        className={`cursor-pointer text-left ${
                          selectedItem?.id === item.id ? "bg-input/10" : ""
                        } ${focusedIndex === index ? "bg-accent" : ""}`}
                        tabIndex={open ? 0 : -1}
                        role="option"
                        aria-selected={selectedItem?.id === item.id}
                      >
                        {imageField && (
                          <TableCell className="text-left">
                            <Image
                              src={item[imageField] || "/images/no-image.jpg"}
                              alt={(getDisplayValue(item) as string) ?? ""}
                              fill
                              className="rounded-sm"
                            />
                          </TableCell>
                        )}
                        {fields.map((field) => (
                          <TableCell key={field.key} className="text-left">
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
                tabIndex={open ? 0 : -1}
              >
                {isRTL ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
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
                tabIndex={open ? 0 : -1}
              >
                {isRTL ? (
                  <ChevronLeft className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      {error && (
        <p className="text-sm text-destructive font-medium">{errorT(error)}</p>
      )}
    </div>
  );
};

export default SelectWithPagination;
