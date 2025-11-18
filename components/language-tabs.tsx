import { Globe, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LanguageFields } from "@/utils/language-handler";

type LanguageTab = "english" | "arabic" | "kurdish";

interface TabConfig {
  value: LanguageTab;
  label: string;
  langCode: keyof LanguageFields;
  dir: "ltr" | "rtl";
  titleLabel: string;
  titlePlaceholder: string;
  descriptionLabel: string;
  descriptionPlaceholder: string;
}

const LANGUAGE_TABS: TabConfig[] = [
  {
    value: "english",
    label: "English",
    langCode: "en",
    dir: "ltr",
    titleLabel: "Title",
    titlePlaceholder: "English Title",
    descriptionLabel: "Description",
    descriptionPlaceholder: "English Description",
  },
  {
    value: "arabic",
    label: "العربية",
    langCode: "ar",
    dir: "rtl",
    titleLabel: "العنوان",
    titlePlaceholder: "العنوان بالعربية",
    descriptionLabel: "الوصف",
    descriptionPlaceholder: "الوصف بالعربية",
  },
  {
    value: "kurdish",
    label: "کوردی",
    langCode: "ckb",
    dir: "rtl",
    titleLabel: "ناونیشان",
    titlePlaceholder: "ناونیشان بە کوردی",
    descriptionLabel: "وەسف",
    descriptionPlaceholder: "وەسف بە کوردی",
  },
];

interface LanguageTabsProps {
  titleFields: LanguageFields;
  descriptionFields?: LanguageFields;
  onTitleChange: (fields: LanguageFields) => void;
  onDescriptionChange?: (fields: LanguageFields) => void;
  activeTab: LanguageTab;
  onTabChange: (tab: LanguageTab) => void;
  additionalFields?: {
    [K in LanguageTab]?: ReactNode;
  };
}

export function LanguageTabs({
  titleFields,
  descriptionFields,
  onTitleChange,
  onDescriptionChange,
  activeTab,
  onTabChange,
  additionalFields,
}: LanguageTabsProps) {
  return (
    <Tabs
      defaultValue="english"
      value={activeTab}
      onValueChange={(value) => onTabChange(value as LanguageTab)}
      className="w-full"
    >
      <div className="mb-6">
        <TabsList className="w-full h-auto p-1 bg-muted/60">
          {LANGUAGE_TABS.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className={cn(
                "flex-1 relative py-2.5 text-sm font-medium transition-all border-b-2 border-transparent rounded-none",
                "data-[state=active]:border-primary data-[state=active]:text-primary",
                "hover:text-primary/80"
              )}
            >
              <span className="text-xs uppercase tracking-wider">
                {tab.label}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {LANGUAGE_TABS.map((tab) => (
        <TabsContent
          key={tab.value}
          value={tab.value}
          className="space-y-4 mt-2 data-[state=active]:animate-in data-[state=active]:fade-in-50"
          dir={tab.dir}
        >
          <div className="space-y-2">
            <Label
              htmlFor={`title-${tab.langCode}`}
              className="text-sm flex items-center gap-2 font-medium"
            >
              <Globe className="h-4 w-4 text-primary" />
              {tab.titleLabel}
            </Label>
            <Input
              id={`title-${tab.langCode}`}
              placeholder={tab.titlePlaceholder}
              value={titleFields[tab.langCode] || ""}
              onChange={(e) =>
                onTitleChange({
                  ...titleFields,
                  [tab.langCode]: e.target.value || null,
                })
              }
              className="transition-all focus-visible:ring-primary/20 focus-visible:ring-offset-0"
            />
          </div>

          {additionalFields?.[tab.value]}

          {descriptionFields && onDescriptionChange && (
            <div className="space-y-2">
              <Label
                htmlFor={`description-${tab.langCode}`}
                className="text-sm flex items-center gap-2 font-medium"
              >
                <FileText className="h-4 w-4 text-primary" />
                {tab.descriptionLabel}
              </Label>
              <Textarea
                id={`description-${tab.langCode}`}
                placeholder={tab.descriptionPlaceholder}
                value={descriptionFields[tab.langCode] || ""}
                onChange={(e) =>
                  onDescriptionChange({
                    ...descriptionFields,
                    [tab.langCode]: e.target.value || null,
                  })
                }
                className="min-h-[120px] transition-all focus-visible:ring-primary/20 focus-visible:ring-offset-0"
              />
            </div>
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
}
