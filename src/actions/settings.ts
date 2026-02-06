"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth, requireRole } from "@/lib/auth/helpers";
import { z } from "zod";

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export async function updateProfile(
  data: Record<string, unknown>
): Promise<ActionResult> {
  try {
    const user = await requireAuth();

    const validated = profileSchema.safeParse(data);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    await prisma.user.update({
      where: { id: user.id! },
      data: { name: validated.data.name },
    });

    revalidatePath("/settings");
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Failed to update profile" };
  }
}

export async function getUsers() {
  await requireRole(["ADMIN"]);

  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function updateUserRole(
  userId: string,
  role: "ADMIN" | "MANAGER" | "STAFF"
): Promise<ActionResult> {
  try {
    await requireRole(["ADMIN"]);

    await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    revalidatePath("/settings");
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Failed to update user role" };
  }
}
