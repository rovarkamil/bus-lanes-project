/* eslint-disable-next-line @zohodesk/no-hardcoding/no-hardcoding */
"use client";

import { useTranslation } from "@/i18n/client";
import { UserIcon, User, Lock } from "lucide-react";
import { useUpdateUser } from "@/hooks/employee-hooks/use-users";
import { useFetchRoles } from "@/hooks/employee-hooks/use-roles";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { UserType } from "@prisma/client";
import {
  UpdateUserData,
  updateUserSchema,
  UpdateUserDialogProps,
  getUserTranslations,
} from "@/types/models/user";
import { Button } from "@/components/ui/button";
import { CustomDialog } from "@/components/ui/custom-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import SelectWithPagination from "@/components/select-with-pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getErrorMessage } from "@/lib/error-message";
import { useEffect } from "react";

export const UpdateUserDialog = ({
  isOpen,
  onOpenChange,
  onSuccess,
  data,
}: UpdateUserDialogProps) => {
  const { t, i18n } = useTranslation("Users");
  const isRTL = i18n.language !== "en";
  const { t: tValidation } = useTranslation("Validation");
  const { t: tFields } = useTranslation("Fields");
  const { mutate: updateUser, isPending: isSubmitting } = useUpdateUser();

  const form = useForm<UpdateUserData>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      id: data?.id || "",
      name: data?.name || "",
      username: data?.username || "",
      password: "",
      userType: data?.userType || UserType.EMPLOYEE,
      roleId: data?.roleId || "",
      balance: data?.balance || 0,
      bypassOTP: data?.bypassOTP || true,
    },
  });

  useEffect(() => {
    if (data) {
      form.reset(data);
    }
  }, [data, form]);

  const handleSubmit = async (formData: UpdateUserData) => {
    try {
      await updateUser(
        {
          ...formData,
          id: data.id,
        },
        {
          onSuccess: () => {
            toast.success(t("Success.Updated"));
            onSuccess?.();
            form.reset();
            onOpenChange(false);
          },
        }
      );
    } catch (error) {
      console.error(error);
    }
  };

  const translations = getUserTranslations(t, tValidation, tFields);

  return (
    <CustomDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      icon={UserIcon}
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
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit(handleSubmit)(e);
        }}
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                {t("UpdateDialog.FullName")}
              </Label>
              <Input
                id="name"
                className="h-10"
                placeholder={t("UpdateDialog.FullNamePlaceholder")}
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
                htmlFor="username"
                className="text-sm flex items-center gap-2"
              >
                <User className="h-4 w-4 text-primary" />
                {t("UpdateDialog.Username")}
              </Label>
              <Input
                id="username"
                className="h-10"
                placeholder={t("UpdateDialog.UsernamePlaceholder")}
                {...form.register("username")}
              />
              {form.formState.errors.username && (
                <p className="text-sm text-destructive">
                  {getErrorMessage(
                    form.formState.errors.username,
                    translations
                  )}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-sm flex items-center gap-2"
              >
                <Lock className="h-4 w-4 text-primary" />
                {t("UpdateDialog.Password")}
              </Label>
              <Input
                id="password"
                type="password"
                className="h-10"
                placeholder={t("UpdateDialog.PasswordPlaceholder")}
                {...form.register("password")}
              />
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">
                  {getErrorMessage(
                    form.formState.errors.password,
                    translations
                  )}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                {t("UpdateDialog.Role")}
              </Label>
              <SelectWithPagination
                fetchFunction={useFetchRoles}
                onSelect={(role) => form.setValue("roleId", role?.id || "")}
                fields={[
                  { key: "name", label: t("Name") },
                  { key: "description", label: t("Description") },
                ]}
                placeholder={t("UpdateDialog.SelectRole")}
                value={form.watch("roleId") || undefined}
                error={
                  form.formState.errors.roleId &&
                  getErrorMessage(form.formState.errors.roleId, translations)
                }
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                {t("UpdateDialog.UserType")}
              </Label>
              <Select
                value={form.watch("userType")}
                onValueChange={(value) =>
                  form.setValue("userType", value as UserType)
                }
                dir={isRTL ? "rtl" : "ltr"}
              >
                <SelectTrigger className="h-10" dir={isRTL ? "rtl" : "ltr"}>
                  <SelectValue placeholder={t("UpdateDialog.SelectUserType")} />
                </SelectTrigger>
                <SelectContent dir={isRTL ? "rtl" : "ltr"}>
                  {Object.values(UserType).map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(`UserTypes.${type}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.userType && (
                <p className="text-sm text-destructive">
                  {getErrorMessage(
                    form.formState.errors.userType,
                    translations
                  )}
                </p>
              )}
            </div>
          </div>
        </div>
      </form>
    </CustomDialog>
  );
};
