/* eslint-disable @zohodesk/no-hardcoding/no-hardcoding */
import { prisma } from "@/lib/prisma";
import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { Session, User } from "next-auth";
import { UserType } from "@prisma/client";
import { verifyPassword } from "./auth/password";
import { v4 as uuidv4 } from "uuid";
import { getIpFromHeaders } from "./utils/get-ip";
import { Headers } from "next/dist/compiled/@edge-runtime/primitives";

export const getLandingPath = (userType?: UserType | null) =>
  userType === UserType.CLIENT ? "/" : "/dashboard";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 1 * 60 * 60 * 24 * 7, // 1 week
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "signIn",
      credentials: {
        username: {
          label: "username",
          type: "text",
          placeholder: "your username",
        },
        password: {
          label: "password",
          type: "password",
          placeholder: "your password",
        },
        ipAddress: {
          label: "ip address",
          type: "text",
        },
      },
      async authorize(credentials, req): Promise<User | null> {
        if (!credentials?.username || !credentials.password) {
          return null;
        }

        const ipAddress = req?.headers
          ? getIpFromHeaders(new Headers(req.headers))
          : null;

        const user = await prisma.user.findFirst({
          where: {
            username: credentials.username,
            deletedAt: null,
          },
          include: {
            role: {
              select: {
                id: true,
                name: true,
                permissions: true,
                kurdishName: true,
                arabicName: true,
              },
            },
          },
        });

        if (!user) {
          return null;
        }

        const isPasswordValid = await verifyPassword(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        // Generate new token and update login information
        const newToken = uuidv4();

        const updatedUser = await prisma.user.update({
          where: { id: user.id },
          data: {
            lastLoginDateAndTime: new Date(),
            lastLoginIp: ipAddress,
            ipAddresses: ipAddress ? { push: ipAddress } : undefined,
            token: newToken,
          },
        });

        return {
          id: user.id,
          name: user.name,
          username: user.username,
          userType: user.userType as UserType,
          deletedAt: user.deletedAt,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          roleId: user.roleId,
          role: user.role,
          lastLoginDateAndTime: updatedUser.lastLoginDateAndTime,
          lastLoginIp: updatedUser.lastLoginIp,
          ipAddresses: updatedUser.ipAddresses,
          balance: user.balance,
          bypassOTP: user.bypassOTP,
          token: newToken,
        };
      },
    }),
  ],
  // Enhanced JWT configuration
  jwt: {
    maxAge: 7 * 24 * 60 * 60, // 1 week
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    session: async ({ session, token }): Promise<Session> => {
      const user = await prisma.user.findUnique({
        where: {
          id: token.id as string,
          deletedAt: null,
        },
        include: {
          role: {
            select: {
              id: true,
              name: true,
              permissions: true,
              kurdishName: true,
              arabicName: true,
            },
          },
        },
      });

      if (!user) {
        throw new Error("User not found");
      }

      return {
        ...session,
        user: {
          id: user.id.toString(),
          name: user.name,
          username: user.username,
          userType: user.userType as UserType,
          deletedAt: user.deletedAt,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          roleId: user.roleId,
          role: user.role,
          lastLoginDateAndTime: user.lastLoginDateAndTime,
          lastLoginIp: user.lastLoginIp,
          ipAddresses: user.ipAddresses,
          balance: user.balance,
          bypassOTP: user.bypassOTP,
          token: user.token,
        },
      };
    },
    jwt: async ({ token, user }) => {
      if (user) {
        return {
          ...token,
          id: user.id,
          name: user.name,
          username: user.username,
          userType: user.userType,
          deletedAt: user.deletedAt,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          roleId: user.roleId,
          role: user.role,
          lastLoginDateAndTime: user.lastLoginDateAndTime,
          lastLoginIp: user.lastLoginIp,
          ipAddresses: user.ipAddresses,
          balance: user.balance,
          bypassOTP: user.bypassOTP,
          token: user.token,
        };
      }

      const currentUser = await prisma.user.findUnique({
        where: {
          id: token.id as string,
          deletedAt: null,
        },
      });

      if (!currentUser || currentUser.token !== token.token) {
        return {};
      }

      return token;
    },
  },
};
