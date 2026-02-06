"use server";

import { prisma } from "@/lib/prisma";
import { categorySchema } from "@/lib/validators/inventory";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/helpers";
import { CategoryType } from "@/generated/prisma/client";

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export type CategoryTreeNode = {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  sortOrder: number;
  type: CategoryType;
  glCode: string | null;
  parentId: string | null;
  _count: { items: number; children: number };
  children: CategoryTreeNode[];
};

/** Get all categories as a flat list (for selects, etc.) */
export async function getCategories() {
  return prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      parent: { include: { parent: true } },
      _count: { select: { items: true, children: true } },
    },
  });
}

/** Get leaf categories (CATEGORY or SUBCATEGORY) that items can be assigned to — excludes SUPER */
export async function getLeafCategories() {
  return prisma.category.findMany({
    where: { type: { not: "SUPER" } },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      parent: { include: { parent: true } },
      _count: { select: { items: true } },
    },
  });
}

/** Get full category tree: SUPER → CATEGORY → SUBCATEGORY */
export async function getCategoryTree(): Promise<CategoryTreeNode[]> {
  const all = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { items: true, children: true } } },
  });

  // Build tree from flat list
  const map = new Map<string, CategoryTreeNode>();
  for (const cat of all) {
    map.set(cat.id, { ...cat, children: [] });
  }

  const roots: CategoryTreeNode[] = [];
  for (const node of map.values()) {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

/** Get a single category by ID with parent chain */
export async function getCategory(id: string) {
  return prisma.category.findUnique({
    where: { id },
    include: {
      parent: { include: { parent: true } },
      children: {
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        include: { _count: { select: { items: true, children: true } } },
      },
      _count: { select: { items: true, children: true } },
    },
  });
}

// Hierarchy validation: what type of parent is allowed for each type
const VALID_PARENT_TYPE: Record<CategoryType, CategoryType | null> = {
  SUPER: null, // SUPER has no parent
  CATEGORY: "SUPER", // CATEGORY must be under a SUPER
  SUBCATEGORY: "CATEGORY", // SUBCATEGORY must be under a CATEGORY
};

export async function createCategory(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireRole(["ADMIN", "MANAGER"]);

    const raw = {
      name: formData.get("name"),
      description: formData.get("description") || undefined,
      color: formData.get("color") || undefined,
      type: formData.get("type") || "CATEGORY",
      parentId: formData.get("parentId") || null,
      glCode: formData.get("glCode") || undefined,
    };

    const validated = categorySchema.safeParse(raw);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const { type, parentId } = validated.data;
    const catType = type as CategoryType;

    // Validate hierarchy
    const expectedParentType = VALID_PARENT_TYPE[catType];
    if (expectedParentType === null && parentId) {
      return { success: false, error: "Super categories cannot have a parent" };
    }
    if (expectedParentType !== null) {
      if (!parentId) {
        return {
          success: false,
          error: `A ${catType.toLowerCase()} must have a parent`,
        };
      }
      const parent = await prisma.category.findUnique({
        where: { id: parentId },
      });
      if (!parent) {
        return { success: false, error: "Parent category not found" };
      }
      if (parent.type !== expectedParentType) {
        return {
          success: false,
          error: `A ${catType.toLowerCase()} must be placed under a ${expectedParentType.toLowerCase()}`,
        };
      }
    }

    // Check duplicate name under same parent
    const existing = await prisma.category.findFirst({
      where: { name: validated.data.name, parentId: parentId ?? null },
    });
    if (existing) {
      return {
        success: false,
        error: "A category with this name already exists at this level",
      };
    }

    const maxSort = await prisma.category.aggregate({
      _max: { sortOrder: true },
      where: { parentId: parentId ?? null },
    });

    const category = await prisma.category.create({
      data: {
        name: validated.data.name,
        description: validated.data.description,
        color: validated.data.color,
        type: catType,
        parentId: parentId ?? null,
        glCode: validated.data.glCode,
        sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
      },
    });

    revalidatePath("/categories");
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
      description: formData.get("description") || undefined,
      color: formData.get("color") || undefined,
      type: formData.get("type") || "CATEGORY",
      parentId: formData.get("parentId") || null,
      glCode: formData.get("glCode") || undefined,
    };

    const validated = categorySchema.safeParse(raw);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const { type, parentId } = validated.data;
    const catType = type as CategoryType;

    // Prevent setting parent to self
    if (parentId === id) {
      return { success: false, error: "A category cannot be its own parent" };
    }

    // Validate hierarchy
    const expectedParentType = VALID_PARENT_TYPE[catType];
    if (expectedParentType === null && parentId) {
      return { success: false, error: "Super categories cannot have a parent" };
    }
    if (expectedParentType !== null) {
      if (!parentId) {
        return {
          success: false,
          error: `A ${catType.toLowerCase()} must have a parent`,
        };
      }
      const parent = await prisma.category.findUnique({
        where: { id: parentId },
      });
      if (!parent) {
        return { success: false, error: "Parent category not found" };
      }
      if (parent.type !== expectedParentType) {
        return {
          success: false,
          error: `A ${catType.toLowerCase()} must be placed under a ${expectedParentType.toLowerCase()}`,
        };
      }
    }

    // Check duplicate name under same parent (excluding self)
    const existing = await prisma.category.findFirst({
      where: {
        name: validated.data.name,
        parentId: parentId ?? null,
        NOT: { id },
      },
    });
    if (existing) {
      return {
        success: false,
        error: "A category with this name already exists at this level",
      };
    }

    await prisma.category.update({
      where: { id },
      data: {
        name: validated.data.name,
        description: validated.data.description,
        color: validated.data.color,
        type: catType,
        parentId: parentId ?? null,
        glCode: validated.data.glCode,
      },
    });

    revalidatePath("/categories");
    revalidatePath("/inventory");
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Failed to update category" };
  }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  try {
    await requireRole(["ADMIN", "MANAGER"]);

    // Check for children
    const childCount = await prisma.category.count({
      where: { parentId: id },
    });
    if (childCount > 0) {
      return {
        success: false,
        error: `Cannot delete: ${childCount} child categor${childCount === 1 ? "y" : "ies"} exist under this category. Delete or reassign them first.`,
      };
    }

    // Check for items
    const itemCount = await prisma.inventoryItem.count({
      where: { categoryId: id },
    });
    if (itemCount > 0) {
      return {
        success: false,
        error: `Cannot delete: ${itemCount} item(s) use this category. Reassign them first.`,
      };
    }

    await prisma.category.delete({ where: { id } });

    revalidatePath("/categories");
    revalidatePath("/inventory");
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Failed to delete category" };
  }
}
