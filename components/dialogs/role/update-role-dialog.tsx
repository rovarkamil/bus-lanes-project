/* eslint-disable-next-line @zohodesk/no-hardcoding/no-hardcoding */
"use client";

import { useTranslation } from "@/i18n/client";
import { Shield } from "lucide-react";
import { useUpdateRole } from "@/hooks/employee-hooks/use-roles";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Permission } from "@prisma/client";
import {
  UpdateRoleData,
  updateRoleSchema,
  UpdateRoleDialogProps,
  getRoleTranslations,
} from "@/types/models/role";
import { Button } from "@/components/ui/button";
import { CustomDialog } from "@/components/ui/custom-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/error-message";
import { useEffect } from "react";

export const UpdateRoleDialog = ({
  data,
  isOpen,
  onOpenChange,
  onSuccess,
}: UpdateRoleDialogProps) => {
  const { t, i18n } = useTranslation("Roles");
  const isRTL = i18n.language !== "en";
  const { t: tValidation } = useTranslation("Validation");
  const { t: tFields } = useTranslation("Fields");
  const { mutate: updateRole, isPending: isSubmitting } = useUpdateRole();

  const form = useForm<UpdateRoleData>({
    resolver: zodResolver(updateRoleSchema),
    defaultValues: {
      id: data?.id || "",
      name: data?.name || "",
      kurdishName: data?.kurdishName || "",
      arabicName: data?.arabicName || "",
      permissions: data?.permissions || [],
    },
  });

  useEffect(() => {
    if (data) {
      form.reset(data);
    }
  }, [data, form]);

  const handleSubmit = async (data: UpdateRoleData) => {
    try {
      await updateRole(data, {
        onSuccess: () => {
          toast.success(t("Success.Updated"));
          onSuccess?.();
          form.reset();
          onOpenChange(false);
        },
      });
    } catch (error) {
      console.error(error);
    }
  };

  const translations = getRoleTranslations(t, tValidation, tFields);

  return (
    <CustomDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      icon={Shield}
      title={t("UpdateDialog.Title")}
      description={t("UpdateDialog.Description")}
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("Cancel")}
          </Button>
          <Button type="submit" form="updateForm" disabled={isSubmitting}>
            {isSubmitting ? t("Submitting") : t("Submit")}
          </Button>
        </>
      }
      rtl={isRTL}
    >
      <form
        id="updateForm"
        onSubmit={form.handleSubmit(handleSubmit)}
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                {t("UpdateDialog.Name")}
              </Label>
              <Input
                id="name"
                className="h-10"
                placeholder={t("UpdateDialog.NamePlaceholder")}
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {getErrorMessage(form.formState.errors.name, translations)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="kurdishName"
                className="text-sm flex items-center gap-2"
              >
                <Shield className="h-4 w-4 text-primary" />
                {t("UpdateDialog.KurdishName")}
              </Label>
              <Input
                id="kurdishName"
                className="h-10"
                placeholder={t("UpdateDialog.KurdishNamePlaceholder")}
                {...form.register("kurdishName")}
              />
              {form.formState.errors.kurdishName && (
                <p className="text-sm text-destructive">
                  {getErrorMessage(
                    form.formState.errors.kurdishName,
                    translations
                  )}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="arabicName"
                className="text-sm flex items-center gap-2"
              >
                <Shield className="h-4 w-4 text-primary" />
                {t("UpdateDialog.ArabicName")}
              </Label>
              <Input
                id="arabicName"
                className="h-10"
                placeholder={t("UpdateDialog.ArabicNamePlaceholder")}
                {...form.register("arabicName")}
              />
              {form.formState.errors.arabicName && (
                <p className="text-sm text-destructive">
                  {getErrorMessage(
                    form.formState.errors.arabicName,
                    translations
                  )}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              {t("UpdateDialog.Permissions")}
            </Label>
            <div className="space-y-4 border rounded-lg p-4">
              {["CHANGE_USD_PRICE", "VIEW", "CREATE", "UPDATE", "DELETE"].map(
                (type) => {
                  const permissionsOfType = Object.values(Permission).filter(
                    (p) => p.startsWith(type)
                  );
                  const selectedPermissionsOfType = (
                    form.watch("permissions") || []
                  ).filter((p) => p.startsWith(type));
                  const allSelected = permissionsOfType.every((p) =>
                    (form.watch("permissions") || []).includes(p)
                  );

                  return (
                    <div key={type} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className={cn("h-7", allSelected && "bg-primary/10")}
                          onClick={() => {
                            const newPermissions = new Set(
                              form.watch("permissions") || []
                            );
                            if (allSelected) {
                              permissionsOfType.forEach((p) =>
                                newPermissions.delete(p)
                              );
                            } else {
                              permissionsOfType.forEach((p) =>
                                newPermissions.add(p)
                              );
                            }
                            form.setValue(
                              "permissions",
                              Array.from(newPermissions)
                            );
                          }}
                        >
                          {type} ({selectedPermissionsOfType.length}/
                          {permissionsOfType.length})
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {permissionsOfType.map((permission) => {
                          const isSelected = (
                            form.watch("permissions") || []
                          ).includes(permission);
                          const label = permission
                            .split("_")
                            .slice(1)
                            .join(" ")
                            .toLowerCase();

                          return (
                            <Button
                              key={permission}
                              type="button"
                              variant="outline"
                              size="sm"
                              className={cn(
                                "justify-start h-7 px-2",
                                isSelected && "bg-primary/10"
                              )}
                              onClick={() => {
                                const newPermissions = new Set(
                                  form.watch("permissions") || []
                                );
                                if (isSelected) {
                                  newPermissions.delete(permission);
                                } else {
                                  newPermissions.add(permission);
                                }
                                form.setValue(
                                  "permissions",
                                  Array.from(newPermissions)
                                );
                              }}
                            >
                              <span className="capitalize truncate">
                                {label}
                              </span>
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
            {form.formState.errors.permissions && (
              <p className="text-sm text-destructive">
                {getErrorMessage(
                  Array.isArray(form.formState.errors.permissions)
                    ? form.formState.errors.permissions[0]
                    : form.formState.errors.permissions,
                  translations
                )}
              </p>
            )}
          </div>
        </div>
      </form>
    </CustomDialog>
  );
};
