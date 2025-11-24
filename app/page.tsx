import { UserType } from "@prisma/client";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/authOptions";
import MapPage from "./map/page";

export default async function CatchAllPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const userType = session.user.userType as UserType;

  if (userType === UserType.CLIENT) {
    return <MapPage />;
  }

  redirect("/dashboard");
}
