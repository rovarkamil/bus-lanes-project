/* eslint-disable-next-line @zohodesk/no-hardcoding/no-hardcoding */
"use client";

import { useTranslation } from "@/i18n/client";
import { UserIcon, User, Lock } from "lucide-react";
import { useCreateUser } from "@/hooks/employee-hooks/use-users";
import { useFetchRoles } from "@/hooks/employee-hooks/use-roles";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { UserType } from "@prisma/client";
import {
  CreateUserData,
  createUserSchema,
  CreateUserDialogProps,
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

export const CreateUserDialog = ({
  isOpen,
  onOpenChange,
  onSuccess,
}: CreateUserDialogProps) => {
  const { t, i18n } = useTranslation("Users");
  const isRTL = i18n.language !== "en";
  const { t: tValidation } = useTranslation("Validation");
  const { t: tFields } = useTranslation("Fields");
  const { mutate: createUser, isPending: isSubmitting } = useCreateUser();

  const form = useForm<CreateUserData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: "",
      username: "",
      password: "",
      userType: UserType.EMPLOYEE,
      roleId: null,
      balance: 0,
      bypassOTP: true,
    },
  });

  const handleSubmit = async (data: CreateUserData) => {
    try {
      await createUser(data, {
        onSuccess: () => {
          toast.success(t("Success.Created"));
          onSuccess?.();
          form.reset();
          onOpenChange(false);
        },
      });
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
      title={t("CreateDialog.Title")}
      description={t("CreateDialog.Description")}
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("Cancel")}
          </Button>
          <Button type="submit" form="createForm" disabled={isSubmitting}>
            {isSubmitting ? t("Submitting") : t("Submit")}
          </Button>
        </>
      }
      rtl={isRTL}
    >
      <form
        id="createForm"
        onSubmit={form.handleSubmit(handleSubmit)}
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                {t("CreateDialog.FullName")}
              </Label>
              <Input
                id="name"
                className="h-10"
                placeholder={t("CreateDialog.FullNamePlaceholder")}
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
                {t("CreateDialog.Username")}
              </Label>
              <Input
                id="username"
                className="h-10"
                placeholder={t("CreateDialog.UsernamePlaceholder")}
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
                {t("CreateDialog.Password")}
              </Label>
              <Input
                id="password"
                type="password"
                className="h-10"
                placeholder={t("CreateDialog.PasswordPlaceholder")}
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
                {t("CreateDialog.Role")}
              </Label>
              <SelectWithPagination
                fetchFunction={useFetchRoles}
                onSelect={(role) => form.setValue("roleId", role?.id || "")}
                fields={[
                  { key: "name", label: t("Name") },
                  { key: "description", label: t("Description") },
                ]}
                placeholder={t("CreateDialog.SelectRole")}
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
                {t("CreateDialog.UserType")}
              </Label>
              <Select
                value={form.watch("userType")}
                onValueChange={(value) =>
                  form.setValue("userType", value as UserType)
                }
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder={t("CreateDialog.SelectUserType")} />
                </SelectTrigger>
                <SelectContent>
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
