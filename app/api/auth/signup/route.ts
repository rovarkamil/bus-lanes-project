import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { hashPassword } from "@/lib/auth/password";
import { UserType } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

const signupSchema = z.object({
  name: z.string().min(3).max(120),
  username: z
    .string()
    .min(3)
    .max(50)
    .regex(
      /^[a-zA-Z0-9._-]+$/,
      "Username can only include letters, numbers, and . _ -"
    ),
  password: z
    .string()
    .min(8)
    .max(128)
    .regex(
      /^(?=.*[A-Za-z])(?=.*\d).+$/,
      "Password must include at least one letter and one number"
    ),
});

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { name, username, password } = signupSchema.parse(payload);

    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Username already in use" },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        username,
        password: hashedPassword,
        userType: UserType.CLIENT,
        token: uuidv4(),
      },
      select: {
        id: true,
        name: true,
        username: true,
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: "Invalid input",
          issues: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Unable to create account" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
