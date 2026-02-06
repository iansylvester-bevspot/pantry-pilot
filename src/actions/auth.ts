"use server";

import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validators/auth";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";

type ActionResult = { success: true } | { success: false; error: string };

export async function registerUser(formData: FormData): Promise<ActionResult> {
  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const validated = registerSchema.safeParse(raw);
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message };
  }

  const existing = await prisma.user.findUnique({
    where: { email: validated.data.email },
  });
  if (existing) {
    return { success: false, error: "An account with this email already exists" };
  }

  const passwordHash = await bcrypt.hash(validated.data.password, 12);

  await prisma.user.create({
    data: {
      name: validated.data.name,
      email: validated.data.email,
      passwordHash,
    },
  });

  return { success: true };
}

export async function loginWithCredentials(
  formData: FormData
): Promise<ActionResult> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/dashboard",
    });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { success: false, error: "Invalid email or password" };
    }
    throw error;
  }
}

export async function loginWithGoogle() {
  await signIn("google", { redirectTo: "/dashboard" });
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
}
