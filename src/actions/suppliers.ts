"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/helpers";
import { supplierSchema, supplierItemSchema } from "@/lib/validators/suppliers";

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function getSuppliers() {
  return prisma.supplier.findMany({
    where: { isActive: true },
    include: {
      _count: { select: { supplierItems: true, purchaseOrders: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getSupplier(id: string) {
  return prisma.supplier.findUnique({
    where: { id },
    include: {
      supplierItems: {
        include: {
          inventoryItem: {
            include: { category: true },
          },
        },
        orderBy: { inventoryItem: { name: "asc" } },
      },
      purchaseOrders: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { location: true },
      },
    },
  });
}

export async function createSupplier(
  data: Record<string, unknown>
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireRole(["ADMIN", "MANAGER"]);

    const validated = supplierSchema.safeParse(data);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const { leadTimeDays, email, website, ...rest } = validated.data;

    const supplier = await prisma.supplier.create({
      data: {
        ...rest,
        email: email || null,
        website: website || null,
        leadTimeDays: leadTimeDays ?? null,
      },
    });

    revalidatePath("/suppliers");
    return { success: true, data: { id: supplier.id } };
  } catch {
    return { success: false, error: "Failed to create supplier" };
  }
}

export async function updateSupplier(
  id: string,
  data: Record<string, unknown>
): Promise<ActionResult> {
  try {
    await requireRole(["ADMIN", "MANAGER"]);

    const validated = supplierSchema.safeParse(data);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const { leadTimeDays, email, website, ...rest } = validated.data;

    await prisma.supplier.update({
      where: { id },
      data: {
        ...rest,
        email: email || null,
        website: website || null,
        leadTimeDays: leadTimeDays ?? null,
      },
    });

    revalidatePath("/suppliers");
    revalidatePath(`/suppliers/${id}`);
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Failed to update supplier" };
  }
}

export async function deleteSupplier(id: string): Promise<ActionResult> {
  try {
    await requireRole(["ADMIN", "MANAGER"]);

    await prisma.supplier.update({
      where: { id },
      data: { isActive: false },
    });

    revalidatePath("/suppliers");
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Failed to delete supplier" };
  }
}

export async function linkSupplierItem(
  data: Record<string, unknown>
): Promise<ActionResult> {
  try {
    await requireRole(["ADMIN", "MANAGER"]);

    const validated = supplierItemSchema.safeParse(data);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const { minOrderQty, ...rest } = validated.data;

    // If this is set as preferred, unset other preferred for this item
    if (validated.data.isPreferred) {
      await prisma.supplierItem.updateMany({
        where: {
          inventoryItemId: validated.data.inventoryItemId,
          isPreferred: true,
        },
        data: { isPreferred: false },
      });
    }

    await prisma.supplierItem.upsert({
      where: {
        supplierId_inventoryItemId: {
          supplierId: validated.data.supplierId,
          inventoryItemId: validated.data.inventoryItemId,
        },
      },
      create: {
        ...rest,
        minOrderQty: minOrderQty ?? null,
      },
      update: {
        ...rest,
        minOrderQty: minOrderQty ?? null,
      },
    });

    revalidatePath("/suppliers");
    revalidatePath(`/suppliers/${validated.data.supplierId}`);
    revalidatePath(`/inventory/${validated.data.inventoryItemId}`);
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Failed to link supplier item" };
  }
}

export async function unlinkSupplierItem(id: string): Promise<ActionResult> {
  try {
    await requireRole(["ADMIN", "MANAGER"]);

    const item = await prisma.supplierItem.delete({ where: { id } });

    revalidatePath("/suppliers");
    revalidatePath(`/suppliers/${item.supplierId}`);
    revalidatePath(`/inventory/${item.inventoryItemId}`);
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Failed to unlink supplier item" };
  }
}
