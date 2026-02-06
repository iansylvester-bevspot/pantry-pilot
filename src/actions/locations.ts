"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/helpers";
import { z } from "zod";

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

const locationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  phone: z.string().optional(),
});

export async function getLocations() {
  return prisma.location.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
}

export async function createLocation(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireRole(["ADMIN"]);

    const raw = {
      name: formData.get("name"),
      address: formData.get("address") || undefined,
      city: formData.get("city") || undefined,
      state: formData.get("state") || undefined,
      zipCode: formData.get("zipCode") || undefined,
      phone: formData.get("phone") || undefined,
    };

    const validated = locationSchema.safeParse(raw);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const location = await prisma.location.create({
      data: validated.data,
    });

    revalidatePath("/locations");
    revalidatePath("/inventory");
    return { success: true, data: { id: location.id } };
  } catch {
    return { success: false, error: "Failed to create location" };
  }
}
