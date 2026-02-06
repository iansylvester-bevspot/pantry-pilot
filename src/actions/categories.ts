"use server";

import { prisma } from "@/lib/prisma";
import { categorySchema } from "@/lib/validators/inventory";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/helpers";

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function getCategories() {
  return prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { items: true } } },
  });
}

export async function createCategory(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireRole(["ADMIN", "MANAGER"]);

    const raw = {
      name: formData.get("name"),
      description: formData.get("description"),
      color: formData.get("color"),
    };

    const validated = categorySchema.safeParse(raw);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const existing = await prisma.category.findFirst({
      where: { name: validated.data.name, parentId: validated.data.parentId ?? null },
    });
    if (existing) {
      return { success: false, error: "A category with this name already exists" };
    }

    const maxSort = await prisma.category.aggregate({ _max: { sortOrder: true } });
    const category = await prisma.category.create({
      data: {
        ...validated.data,
        sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
      },
    });

    revalidatePath("/inventory/categories");
    revalidatePath("/inventory");
    return { success: true, data: { id: category.id } };
  } catch {
    return { success: false, error: "Failed to create category" };
  }
}

export async function updateCategory(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireRole(["ADMIN", "MANAGER"]);

    const raw = {
      name: formData.get("name"),
      description: formData.get("description"),
      color: formData.get("color"),
    };

    const validated = categorySchema.safeParse(raw);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const existing = await prisma.category.findFirst({
      where: { name: validated.data.name, NOT: { id } },
    });
    if (existing) {
      return { success: false, error: "A category with this name already exists" };
    }

    await prisma.category.update({
      where: { id },
      data: validated.data,
    });

    revalidatePath("/inventory/categories");
    revalidatePath("/inventory");
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Failed to update category" };
  }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  try {
    await requireRole(["ADMIN", "MANAGER"]);

    const itemCount = await prisma.inventoryItem.count({
      where: { categoryId: id },
    });
    if (itemCount > 0) {
      return {
        success: false,
        error: `Cannot delete: ${itemCount} item(s) use this category`,
      };
    }

    await prisma.category.delete({ where: { id } });

    revalidatePath("/inventory/categories");
    revalidatePath("/inventory");
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Failed to delete category" };
  }
}
