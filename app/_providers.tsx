/* eslint-disable-next-line @zohodesk/no-hardcoding/no-hardcoding */
"use client";

import { Toaster } from "@/components/ui/sonner";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { FC, ReactNode } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { BaseError } from "@/types/models/common";
import { ApiRequestError } from "@/utils/createHook";
import { CustomErrorHandler } from "@/lib/custom-error-handler";
import { useErrorTranslation } from "@/lib/error-translator";

export const Providers: FC<{ children: ReactNode }> = ({ children }) => {
  const { t } = useTranslation("");
  const { translateError } = useErrorTranslation();

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
        retry: false,
        networkMode: "online",
        refetchOnMount: "always",
        refetchOnWindowFocus: false,
        refetchOnReconnect: "always",
      },
      mutations: {
        retry: false,
        onError: (error: unknown) => {
          if (error instanceof ApiRequestError) {
            const translatedMessage = translateError(error);
            toast.error(translatedMessage);
            return;
          }

          if (error instanceof CustomErrorHandler) {
            const translatedMessage = translateError(error);
            toast.error(translatedMessage);
            return;
          }

          if (error instanceof BaseError) {
            const translatedMessage = translateError(error);
            toast.error(translatedMessage);
            return;
          }

          const defaultError = t("System.Errors.UnexpectedError");
          toast.error(defaultError);
        },
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        {children}
        <Toaster richColors position="top-center" closeButton duration={1000} />
      </SessionProvider>
    </QueryClientProvider>
  );
};
