/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  UseMutationResult,
  UseQueryResult,
  useMutation,
  useQuery,
  useInfiniteQuery,
  UseInfiniteQueryResult,
} from "@tanstack/react-query";
import { FieldConfig } from "@/types/models/common";
import { BaseError } from "@/types/models/common";

interface QueryHookOptions<TParams extends Record<string, unknown>> {
  queryKey: string[];
  url: string;
  options?: {
    fieldConfigs?: Record<string, FieldConfig>;
    params?: TParams;
  };
}

interface InfiniteQueryHookOptions<TParams extends Record<string, unknown>>
  extends QueryHookOptions<TParams> {
  getNextPageParam: (lastPage: any) => number | undefined;
}

interface MutationHookOptions {
  method: "POST" | "PUT" | "DELETE";
  url: string;
}

interface ApiErrorData {
  success: boolean;
  error: {
    message: string;
    details?: string;
    status: number;
    field?: string;
    code?: string;
    type?: string;
    value?: string;
  };
}

export class ApiRequestError extends BaseError {
  constructor(errorData: ApiErrorData) {
    const messageKey = errorData.error.message;
    const status =
      typeof errorData.error.status === "string"
        ? parseInt(errorData.error.status, 10)
        : errorData.error.status;

    super(
      messageKey,
      status,
      errorData.error.field,
      errorData.error.code,
      errorData.error.type,
      errorData.error.value
    );
    this.originalError = errorData.error;
  }

  public originalError: ApiErrorData["error"];
}

async function fetchApi<TData>(
  url: string,
  params?: Record<string, unknown>
): Promise<TData> {
  const queryString = params
    ? `?${new URLSearchParams(
        Object.entries(params).reduce(
          (acc, [key, value]) => {
            if (value !== undefined && value !== null) {
              acc[key] =
                typeof value === "object"
                  ? JSON.stringify(value)
                  : String(value);
            }
            return acc;
          },
          {} as Record<string, string>
        )
      ).toString()}`
    : "";

  const response = await fetch(`${url}${queryString}`);
  const data = await response.json();

  if (!response.ok) {
    throw new ApiRequestError(data);
  }

  return data;
}

export function createQueryHook<TData, TParams extends Record<string, unknown>>(
  options: QueryHookOptions<TParams>
) {
  return (params?: TParams): UseQueryResult<TData, ApiRequestError> => {
    const { enabled, ...restParams } = params || ({} as TParams);
    return useQuery({
      queryKey: [...options.queryKey, restParams],
      queryFn: () =>
        fetchApi<TData>(options.url, {
          ...options.options?.params,
          ...restParams,
        }),
      enabled: enabled !== false,
    });
  };
}

export function createInfiniteQueryHook<
  TData,
  TParams extends Record<string, unknown>,
>(options: InfiniteQueryHookOptions<TParams>) {
  return (params?: TParams): UseInfiniteQueryResult<TData, ApiRequestError> => {
    return useInfiniteQuery({
      queryKey: [...options.queryKey, params],
      queryFn: ({ pageParam = 1 }) =>
        fetchApi<TData>(options.url, {
          ...options.options?.params,
          ...params,
          page: pageParam,
        }),
      getNextPageParam: options.getNextPageParam,
      initialPageParam: 1,
    });
  };
}

export function createMutationHook<TData, TVariables>(
  options: MutationHookOptions
): () => UseMutationResult<TData, ApiRequestError, TVariables> {
  return () => {
    return useMutation({
      mutationFn: async (variables: TVariables) => {
        const response = await fetch(options.url, {
          method: options.method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(variables),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new ApiRequestError(data);
        }

        return data;
      },
    });
  };
}
