import { toast } from "sonner";

export const copyToClipboard = (str: string) => {
  navigator.clipboard
    .writeText(str)
    .then(() => {
      const truncatedStr = str.length > 8 ? str.slice(0, 8) + "..." : str;
      toast.success(`Copied "${truncatedStr}" to clipboard.`);
    })
    .catch(() => {
      toast.error("Couldn't copy to clipboard.");
    });
};
