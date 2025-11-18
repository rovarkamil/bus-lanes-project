import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { type Column, type RenderContext } from "@/types/data-table";
import {
  type AuditLogWithRelations,
  AUDIT_LOG_ACTION_BUTTONS,
} from "@/types/models/audit-log";
import { formatDate } from "@/lib/formatDate";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/badge";
import { RequestMethod, UserType } from "@prisma/client";

const EntityCell = ({
  auditLog,
  t,
}: {
  auditLog: AuditLogWithRelations;
  t: (key: string) => string;
}) => {
  const getDisplayEntity = (entityType: string, path: string | null) => {
    if (entityType === "API" && path) {
      // Extract the last part of the path
      const parts = path.split("/");
      return parts[parts.length - 1];
    }
    return t(`EntityTypes.${entityType}`) || entityType;
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-col">
        <span className="font-medium text-foreground">
          {getDisplayEntity(auditLog.entityType, auditLog.path)}
        </span>
        <span className="text-xs text-muted-foreground">
          {auditLog.entityId}
        </span>
      </div>
    </div>
  );
};

const UserCell = ({
  user,
  t,
}: {
  user: { name: string; username: string } | null;
  t: (key: string) => string;
}) => {
  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-col">
        <span className="font-medium text-foreground">
          {user?.name ?? t("NoUser")}
        </span>
        <span className="text-xs text-muted-foreground">
          {user?.username ?? t("NoUsername")}
        </span>
      </div>
    </div>
  );
};

const RequestMethodCell = ({
  method,
  t,
}: {
  method: RequestMethod;
  t: (key: string) => string;
}) => {
  const methodColors = {
    GET: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 ring-emerald-500/30",
    POST: "bg-blue-500/15 text-blue-700 dark:text-blue-400 ring-blue-500/30",
    PUT: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 ring-yellow-500/30",
    DELETE: "bg-red-500/15 text-red-700 dark:text-red-400 ring-red-500/30",
    PATCH:
      "bg-purple-500/15 text-purple-700 dark:text-purple-400 ring-purple-500/30",
    UNKNOWN: "bg-gray-500/15 text-gray-700 dark:text-gray-400 ring-gray-500/30",
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "px-2 py-1 rounded-lg font-medium ring-1",
        methodColors[method] || methodColors.UNKNOWN
      )}
    >
      {t(`RequestMethods.${method}`)}
    </Badge>
  );
};

const DateCell = ({ date }: { date: Date }) => {
  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-col">
        <span className="font-medium text-foreground">{formatDate(date)}</span>
      </div>
    </div>
  );
};

const IpAddressCell = ({ ipAddress }: { ipAddress: string | null }) => {
  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-col">
        <span className="font-medium text-foreground">
          {ipAddress || "Unknown"}
        </span>
      </div>
    </div>
  );
};

const ActionButtons = ({
  item,
  context,
}: {
  item: AuditLogWithRelations;
  context: RenderContext<AuditLogWithRelations>;
}) => (
  <div className="flex items-center gap-2">
    {AUDIT_LOG_ACTION_BUTTONS.map((button, idx) => {
      const hasPermission =
        !button.requiresPermission ||
        context.session?.user.userType === UserType.SUPER_ADMIN ||
        context.session?.user.role?.permissions.includes(
          button.requiresPermission
        );

      const Icon = button.icon;

      return (
        <TooltipProvider key={idx}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8", button.className)}
                disabled={!hasPermission}
                onClick={() =>
                  button.onClick(item, {
                    setSelectedItem: context.handlers.setSelectedItem,
                    setIsViewDialogOpen: context.handlers.setIsViewDialogOpen,
                  })
                }
              >
                <Icon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <span>{context.t(button.tooltip)}</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    })}
  </div>
);

// Define the columns with translatable labels
const getColumns = (
  t: (key: string) => string
): Column<AuditLogWithRelations>[] => [
  {
    key: "userId",
    label: t("User"),
    sortable: true,
    showInMobile: true,
    render: (item: AuditLogWithRelations) => (
      <UserCell user={item.user} t={t} />
    ),
  },
  {
    key: "ipAddress",
    label: t("IPAddress"),
    sortable: true,
    showInMobile: false,
    render: (item: AuditLogWithRelations) => (
      <IpAddressCell ipAddress={item.ipAddress} />
    ),
  },
  {
    key: "requestMethod",
    label: t("RequestMethod"),
    sortable: true,
    showInMobile: true,
    render: (item: AuditLogWithRelations) => (
      <RequestMethodCell method={item.method} t={t} />
    ),
  },
  {
    key: "entityType",
    label: t("Entity"),
    sortable: true,
    showInMobile: true,
    render: (item: AuditLogWithRelations) => (
      <EntityCell auditLog={item} t={t} />
    ),
  },
  {
    key: "createdAt",
    label: t("Created"),
    sortable: true,
    showInMobile: false,
    render: (item: AuditLogWithRelations) => <DateCell date={item.createdAt} />,
  },
  {
    key: "actions",
    label: t("Actions"),
    sortable: false,
    showInMobile: true,
    render: (
      item: AuditLogWithRelations,
      context: RenderContext<AuditLogWithRelations>
    ) => <ActionButtons item={item} context={context} />,
  },
];

// Export the function to generate translated columns
export { getColumns as getAuditLogColumns };
