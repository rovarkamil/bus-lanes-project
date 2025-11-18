import { BaseError } from "@/types/models/common";
export { BaseError } from "@/types/models/common";

export class CustomErrorHandler extends BaseError {
  constructor(
    namespace: string,
    category: string,
    key: string,
    status: number = 400,
    field?: string,
    value?: string
  ) {
    const messageKey = `${namespace}.${category}.${key}`;
    super(messageKey, status, field, undefined, undefined, value);
    this.name = "CustomErrorHandler";
    this.namespace = namespace;
    this.category = category;
    this.key = key;
  }

  public namespace: string;
  public category: string;
  public key: string;
}

export class UniqueConstraintError extends CustomErrorHandler {
  constructor(
    namespace: string,
    field: string,
    value?: string,
    status: number = 400
  ) {
    super(namespace, "Validation", "AlreadyExists", status, field, value);
    this.name = "UniqueConstraintError";
    this.type = "unique_constraint";
  }

  public getTranslatedMessage(
    t: (key: string, options?: { ns?: string }) => string
  ): string {
    const fieldName = t(`Fields.${this.field}`, { ns: "Fields" });
    const errorMessage = t("Fields.Errors.AlreadyExists", { ns: "Fields" });
    return `${fieldName} ${errorMessage}`;
  }
}

type ErrorConfig = {
  status?: number;
  value?: string;
};

export function createError(
  namespace: string,
  category: string,
  key: string,
  status: number = 400,
  config: ErrorConfig = {}
) {
  const { value } = config;
  return new CustomErrorHandler(
    namespace,
    category,
    key,
    status,
    undefined,
    value
  );
}

// throw createError('Users', 'Errors', 'CannotDeleteSelf', 403);
