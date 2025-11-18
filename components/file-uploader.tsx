"use client";

import { Button } from "@/components/ui/button";
import { FileText, Upload, X, FileAudio, FileType, Play } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Loader } from "@/components/loader";
import { useTranslation } from "@/i18n/client";
import NextImage from "next/image";
import { VideoPreviewer } from "./show-video-previewer";

interface FileUploaderProps {
  onFileSelect: (file: File, uploadedUrl?: string) => void;
  onFileRemove: () => void;
  selectedFile?: { file: File; url: string } | null;
  maxSize?: number; // in bytes
  label?: string;
  className?: string;
  accept?: string;
}

const FilePreview = ({ file, url }: { file: File; url: string }) => {
  const [isVideoPreviewOpen, setIsVideoPreviewOpen] = useState(false);
  const type = file.type;

  if (type.startsWith("image/")) {
    return (
      <div className="relative w-32 h-32 rounded-xl overflow-hidden">
        <NextImage src={url} alt={file.name} fill className="object-cover" />
      </div>
    );
  }

  if (type.startsWith("video/")) {
    return (
      <>
        <div
          className="relative w-32 h-32 rounded-xl overflow-hidden bg-muted/50 flex items-center justify-center group cursor-pointer"
          onClick={() => setIsVideoPreviewOpen(true)}
        >
          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
          <Play className="w-10 h-10 text-white group-hover:scale-110 transition-transform z-10" />
        </div>
        <VideoPreviewer
          isOpen={isVideoPreviewOpen}
          onClose={() => setIsVideoPreviewOpen(false)}
          videoUrl={url}
        />
      </>
    );
  }

  if (type.startsWith("audio/"))
    return (
      <FileAudio
        className="h-12 w-12 text-muted-foreground"
        aria-label="Audio file"
      />
    );

  if (type === "application/pdf")
    return (
      <FileType
        className="h-12 w-12 text-muted-foreground"
        aria-label="PDF file"
      />
    );

  return (
    <FileText
      className="h-12 w-12 text-muted-foreground"
      aria-label="Document file"
    />
  );
};

export const FileUploader: React.FC<FileUploaderProps> = ({
  onFileSelect,
  onFileRemove,
  selectedFile,
  maxSize = 5 * 1024 * 1024, // 5MB default
  label = "File",
  className,
  accept = "*/*",
}) => {
  const { t } = useTranslation("Common");
  const [fileLoadingStates, setFileLoadingStates] = useState<{
    [key: string]: boolean;
  }>({});
  const [localLoading, setLocalLoading] = useState(false);
  const [uniqueId] = useState(() => Math.random().toString(36).substring(7));
  const inputId = `fileInput-${uniqueId}`;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setLocalLoading(true);

    // Check file size
    if (file.size > maxSize) {
      toast.error(
        t("FileSizeMustBeLessThan", {
          size: maxSize / (1024 * 1024),
        })
      );
      setLocalLoading(false);
      return;
    }

    try {
      const url = URL.createObjectURL(file);

      setFileLoadingStates((prev) => ({
        ...prev,
        [url]: true,
      }));

      // Pass the file to parent
      onFileSelect(file);
      setLocalLoading(false);
    } catch (error) {
      console.error("Error processing file:", error);
      toast.error(t("FailedToProcessFile"));
      setLocalLoading(false);
    }
  };

  const handleFileRemove = () => {
    if (selectedFile?.url) {
      URL.revokeObjectURL(selectedFile.url);
    }
    onFileRemove();
    setFileLoadingStates({});
    const input = document.getElementById(inputId) as HTMLInputElement;
    if (input) {
      input.value = "";
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <label
        htmlFor={inputId}
        className="text-sm font-medium flex items-center gap-2 text-gray-700 dark:text-gray-300"
      >
        <FileText className="h-4 w-4 text-primary" aria-label={label} />
        {label}
      </label>
      <div
        className={cn(
          "relative rounded-xl border-2 border-dashed transition-all duration-300",
          "bg-muted/30 dark:bg-muted/10",
          "hover:bg-muted/50 dark:hover:bg-muted/20",
          "group",
          selectedFile ? "p-4" : "p-8",
          "flex items-center justify-center"
        )}
      >
        <input
          id={inputId}
          type="file"
          className="hidden"
          accept={accept}
          onChange={handleFileSelect}
          disabled={localLoading}
        />

        {!selectedFile ? (
          <div
            className="flex flex-col items-center gap-4 text-center cursor-pointer w-full h-full"
            onClick={() => document.getElementById(inputId)?.click()}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-xl blur-lg group-hover:blur-xl transition-all duration-300 opacity-0 group-hover:opacity-100" />
              <div className="relative p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/10 shadow-lg shadow-primary/5 group-hover:shadow-primary/10 transition-all duration-300">
                {localLoading ? (
                  <Loader className="h-8 w-8" />
                ) : (
                  <Upload className="h-8 w-8 text-primary group-hover:scale-110 transition-transform duration-300" />
                )}
              </div>
            </div>
            <div>
              <p className="font-medium text-muted-foreground group-hover:text-primary transition-colors duration-300">
                {t("ClickToUploadOrDragAndDrop")}
              </p>
              <p className="text-sm text-muted-foreground/80">
                {t("MaxSize", {
                  size: maxSize / (1024 * 1024),
                })}
              </p>
            </div>
          </div>
        ) : (
          <div className="relative w-full">
            <div className="flex items-center gap-6">
              <div className="relative w-32 h-32 border border-border rounded-xl flex items-center justify-center bg-muted/50 overflow-hidden">
                {(fileLoadingStates[selectedFile.url] || localLoading) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-xl z-10">
                    <Loader className="h-8 w-8" />
                  </div>
                )}
                <FilePreview file={selectedFile.file} url={selectedFile.url} />
              </div>
              <div className="flex-1 flex flex-col gap-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {t("SelectedFile")}
                </p>
                <p className="text-xs text-muted-foreground/80">
                  {selectedFile.file.name.slice(0, 12)}
                  {selectedFile.file.name.length > 12 && "..."}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="hover:bg-destructive/90 transition-colors duration-300"
                    onClick={handleFileRemove}
                    disabled={localLoading}
                  >
                    <X className="h-4 w-4 mr-2" />
                    {t("Remove")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="hover:bg-primary/10 transition-colors duration-300"
                    onClick={() => document.getElementById(inputId)?.click()}
                    disabled={localLoading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {t("Change")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
