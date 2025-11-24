import { UserType } from "@prisma/client";
import { getToken } from "next-auth/jwt";
import { withAuth } from "next-auth/middleware";
import { NextRequest, NextResponse } from "next/server";

export default withAuth(
  async function middleware(req: NextRequest) {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const userType = token.userType as UserType;
    const path = req.nextUrl.pathname;

    // SUPER_ADMIN can access all routes matched by this middleware
    if (userType === UserType.SUPER_ADMIN) {
      return NextResponse.next();
    }

    // EMPLOYEE routes guard: allow dashboard + root landing page
    if (
      userType === UserType.EMPLOYEE &&
      path !== "/" &&
      !path.startsWith("/dashboard")
    ) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  },
  {
    callbacks: {},
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*"],
};
