import { UserType } from "@prisma/client";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/authOptions";

export default async function CatchAllPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const userType = session.user.userType as UserType;

  switch (userType) {
    case UserType.SUPER_ADMIN:
      redirect("/dashboard");
    case UserType.EMPLOYEE:
      redirect("/dashboard");
    default:
      redirect("/dashboard");
  }
}
