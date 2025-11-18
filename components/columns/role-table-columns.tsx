import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/data-table/confirmation-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { type Column, type RenderContext } from "@/types/data-table";
import {
  type RoleWithRelations,
  ROLE_ACTION_BUTTONS,
} from "@/types/models/role";
import { formatDate } from "@/lib/formatDate";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { UserType } from "@prisma/client";

const RoleNameCell = ({ role }: { role: RoleWithRelations }) => (
  <div className="flex items-center gap-3">
    <div className="flex flex-col">
      <span className="font-medium text-foreground">{role.name}</span>
      <span className="text-xs text-muted-foreground">
        {role.users?.length ?? 0} {role.users?.length === 1 ? "user" : "users"}
      </span>
    </div>
  </div>
);

const PermissionsCell = ({
  permissions,
  t,
}: {
  permissions: string[];
  t: (key: string) => string;
}) => {
  // Group permissions by type (VIEW, CREATE, UPDATE, DELETE)
  const groups = permissions.reduce(
    (acc, permission) => {
      const type = permission.split("_")[0];
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(permission);
      return acc;
    },
    {} as Record<string, string[]>
  );

  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(groups).map(([type, perms]) => (
        <TooltipProvider key={type}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="text-xs capitalize">
                {t(type)} ({perms.length})
              </Badge>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              align="start"
              className="max-w-[300px]"
            >
              <div className="space-y-1.5">
                <p className="font-medium capitalize">
                  {t(type)} {t("Permissions")}:
                </p>
                <div className="flex flex-col gap-1">
                  {perms.map((perm) => (
                    <span key={perm} className="text-xs">
                      {t(`PermissionsTypes.${perm}`)}
                    </span>
                  ))}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  );
};

const StatusCell = ({
  deletedAt,
  t,
}: {
  deletedAt: Date | null;
  t: (key: string) => string;
}) => (
  <span
    className={cn(
      "text-sm font-medium",
      deletedAt ? "text-destructive" : "text-muted-foreground"
    )}
  >
    {deletedAt ? t("Deleted") : t("Active")}
  </span>
);

const DateCell = ({ date }: { date: Date }) => (
  <span className="text-sm text-muted-foreground">{formatDate(date)}</span>
);

const ActionButtons = ({
  item,
  context,
}: {
  item: RoleWithRelations;
  context: RenderContext<RoleWithRelations>;
}) => (
  <div className="flex items-center gap-2">
    {ROLE_ACTION_BUTTONS.map((button, idx) => {
      const hasPermission =
        !button.requiresPermission ||
        context.session?.user.userType === UserType.SUPER_ADMIN ||
        context.session?.user.role?.permissions.includes(
          button.requiresPermission
        );

      const Icon = button.icon;

      if (button.requiresPermission === "DELETE_ROLE") {
        return (
          <ConfirmationDialog
            key={idx}
            title={context.t("AreYouSure")}
            message={context.t("AreYouSureYouWantToDeleteThisRole")}
            onConfirm={() =>
              button.onClick(item, {
                handleDelete: context.handlers.handleDelete,
              })
            }
            confirmLabel={
              context.isDeleting ? context.t("Deleting") : context.t("Delete")
            }
            cancelLabel={context.t("Cancel")}
            variant="destructive"
            isRtl={context.handlers.isRtl}
            disabled={context.isDeleting}
          >
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8", button.className)}
              disabled={!hasPermission}
            >
              <Icon className="h-4 w-4" />
            </Button>
          </ConfirmationDialog>
        );
      }

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
                    handleOpenUpdateDialog:
                      context.handlers.handleOpenUpdateDialog,
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
): Column<RoleWithRelations>[] => [
  {
    key: "name",
    label: t("Name"),
    sortable: true,
    showInMobile: true,
    render: (item: RoleWithRelations) => <RoleNameCell role={item} />,
  },
  {
    key: "permissions",
    label: t("Permissions"),
    sortable: false,
    showInMobile: true,
    render: (
      item: RoleWithRelations,
      context: RenderContext<RoleWithRelations>
    ) => <PermissionsCell permissions={item.permissions} t={context.t} />,
  },
  {
    key: "deletedAt",
    label: t("Status"),
    sortable: true,
    showInMobile: false,
    render: (
      item: RoleWithRelations,
      context: RenderContext<RoleWithRelations>
    ) => <StatusCell deletedAt={item.deletedAt} t={context.t} />,
  },
  {
    key: "createdAt",
    label: t("Created"),
    sortable: true,
    showInMobile: false,
    render: (item: RoleWithRelations) => <DateCell date={item.createdAt} />,
  },
  {
    key: "actions",
    label: t("Actions"),
    sortable: false,
    showInMobile: true,
    render: (
      item: RoleWithRelations,
      context: RenderContext<RoleWithRelations>
    ) => <ActionButtons item={item} context={context} />,
  },
];

export { getColumns as getRoleColumns };
