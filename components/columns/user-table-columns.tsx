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
  type UserWithRelations,
  USER_ACTION_BUTTONS,
} from "@/types/models/user";
import { formatDate } from "@/lib/formatDate";
import { cn } from "@/lib/utils";
import { AlertCircle, Globe, LogIn, Shield, RefreshCw } from "lucide-react";
import { TFunction } from "i18next";
import { useTranslation } from "@/i18n/client";
import { UserType } from "@prisma/client";
import { useRefreshUserToken } from "@/hooks/employee-hooks/use-users";
import { toast } from "sonner";

const UserNameCell = ({ user }: { user: UserWithRelations }) => (
  <div className="flex items-center gap-3">
    <div className="flex flex-col">
      <span className="font-medium text-foreground">{user.name}</span>
      <span className="text-xs text-muted-foreground">{user.username}</span>
    </div>
  </div>
);

const RoleCell = ({ role }: { role: { name: string } | null }) => (
  <span className="text-sm text-muted-foreground font-medium">
    {role?.name || "-"}
  </span>
);

const UserTypeCell = ({
  userType,
  t,
}: {
  userType: string;
  t: TFunction<string, undefined>;
}) => (
  <span className="text-sm text-muted-foreground font-medium">
    {t(`UserTypes.${userType}`)}
  </span>
);

const DateCell = ({ date }: { date: Date }) => (
  <span className="text-sm text-muted-foreground">{formatDate(date)}</span>
);

const UserStatusCell = ({
  user,
  t,
}: {
  user: UserWithRelations;
  t: TFunction<string, undefined>;
}) => {
  const statuses = [
    {
      active: user.userType === UserType.SUPER_ADMIN,
      icon: Shield,
      tooltip: t("Admin"),
      className: "text-blue-500",
    },
  ];

  return (
    <div className="flex items-center gap-1.5">
      {statuses.map(
        (status, index) =>
          status.active && (
            <TooltipProvider key={index}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center">
                    <status.icon className={cn("h-4 w-4", status.className)} />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <span>{status.tooltip}</span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
      )}
      {!statuses.some((s) => s.active) && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 text-gray-400" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <span>{t("NoSpecialStatus")}</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
};

const LoginInfoCell = ({
  user,
  t,
}: {
  user: UserWithRelations;
  t: TFunction<string, undefined>;
}) => {
  const hasLoginInfo =
    user.lastLoginDateAndTime ||
    user.lastLoginIp ||
    user.ipAddresses.length > 0;

  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1">
              <LogIn
                className={cn(
                  "h-4 w-4",
                  hasLoginInfo ? "text-blue-500" : "text-gray-400"
                )}
              />
              {user.lastLoginIp && <Globe className="h-4 w-4 text-green-500" />}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="flex flex-col gap-1">
              {user.lastLoginDateAndTime && (
                <span className="text-sm">
                  {t("LastLogin")}: {formatDate(user.lastLoginDateAndTime)}
                </span>
              )}
              {user.lastLoginIp && (
                <span className="text-sm">
                  {t("LastLoginIp")}: {user.lastLoginIp}
                </span>
              )}
              {user.ipAddresses.length > 0 && (
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium">{t("IPHistory")}:</span>
                  {user.ipAddresses.map((ip, index) => (
                    <span key={index} className="text-sm text-muted-foreground">
                      {ip}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

const ActionButtons = ({
  item,
  context,
}: {
  item: UserWithRelations;
  context: RenderContext;
}) => {
  const { mutate: refreshToken, isPending: isRefreshing } =
    useRefreshUserToken();

  const handleRefreshToken = async () => {
    try {
      await refreshToken(
        { id: item.id },
        {
          onSuccess: () => {
            toast.success(context.t("TokenRefreshed"));
          },
          onError: () => {
            toast.error(context.t("FailedToRefreshToken"));
          },
        }
      );
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={
                isRefreshing ||
                !context.session?.user.role?.permissions.includes("UPDATE_USER")
              }
              onClick={handleRefreshToken}
            >
              <RefreshCw
                className={cn("h-4 w-4", isRefreshing && "animate-spin")}
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <span>{context.t("RefreshToken")}</span>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {USER_ACTION_BUTTONS.map((button, idx) => {
        const hasPermission =
          !button.requiresPermission ||
          context.session?.user.userType === UserType.SUPER_ADMIN ||
          context.session?.user.role?.permissions.includes(
            button.requiresPermission
          );

        const Icon = button.icon;

        if (button.requiresPermission === "DELETE_USER") {
          return (
            <ConfirmationDialog
              key={idx}
              title={context.t("AreYouSure")}
              message={context.t("AreYouSureYouWantToDeleteThisUser")}
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
};

// Define the columns without using hooks
export const getColumns = (t: TFunction): Column<UserWithRelations>[] => {
  return [
    {
      key: "name",
      label: t("Users.Name"),
      sortable: true,
      render: (user) => <UserNameCell user={user} />,
    },
    {
      key: "role",
      label: t("Users.Role"),
      sortable: false,
      render: (user) => <RoleCell role={user.role} />,
    },
    {
      key: "userType",
      label: t("Users.UserType"),
      sortable: true,
      render: (user) => <UserTypeCell userType={user.userType} t={t} />,
    },
    {
      key: "status",
      label: t("Users.Status"),
      sortable: false,
      render: (user) => <UserStatusCell user={user} t={t} />,
    },
    {
      key: "loginInfo",
      label: t("Users.LoginInfo"),
      sortable: false,
      render: (user) => <LoginInfoCell user={user} t={t} />,
    },
    {
      key: "createdAt",
      label: t("Users.CreatedAt"),
      sortable: true,
      render: (user) => <DateCell date={user.createdAt} />,
    },
    {
      key: "actions",
      label: t("Users.Actions"),
      sortable: false,
      className: "w-[100px]",
      render: (user, context) => (
        <ActionButtons item={user} context={context} />
      ),
    },
  ];
};

// React component that uses the hook and returns the columns
export const UserTableColumns = () => {
  const { t } = useTranslation("Users");
  return getColumns(t);
};
