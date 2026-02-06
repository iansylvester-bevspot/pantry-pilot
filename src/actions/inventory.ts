"use server";

import { prisma } from "@/lib/prisma";
import {
  inventoryItemSchema,
  stockAdjustmentSchema,
} from "@/lib/validators/inventory";
import { revalidatePath } from "next/cache";
import { requireAuth, requireRole } from "@/lib/auth/helpers";
import { UnitType } from "@/generated/prisma/client";

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function getInventoryItems(locationId?: string) {
  return prisma.inventoryItem.findMany({
    where: locationId ? { locationId } : undefined,
    include: {
      category: { include: { parent: { include: { parent: true } } } },
      stockLevels: true,
    },
    orderBy: { name: "asc" },
  });
}

export async function getInventoryItem(id: string) {
  return prisma.inventoryItem.findUnique({
    where: { id },
    include: {
      category: { include: { parent: { include: { parent: true } } } },
      stockLevels: { include: { location: true } },
      supplierItems: { include: { supplier: true } },
      priceHistory: { orderBy: { changedAt: "desc" }, take: 10 },
    },
  });
}

export async function createInventoryItem(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireRole(["ADMIN", "MANAGER"]);

    const raw = {
      name: formData.get("name"),
      sku: formData.get("sku") || undefined,
      description: formData.get("description") || undefined,
      categoryId: formData.get("categoryId") || undefined,
      unit: formData.get("unit"),
      unitCost: formData.get("unitCost"),
      parLevel: formData.get("parLevel"),
      maxLevel: formData.get("maxLevel") || undefined,
      storageTemp: formData.get("storageTemp") || undefined,
      shelfLifeDays: formData.get("shelfLifeDays") || undefined,
      notes: formData.get("notes") || undefined,
      glCode: formData.get("glCode") || undefined,
      locationId: formData.get("locationId"),
      vintage: formData.get("vintage") || undefined,
      binNumber: formData.get("binNumber") || undefined,
      varietal: formData.get("varietal") || undefined,
      region: formData.get("region") || undefined,
      producer: formData.get("producer") || undefined,
      abv: formData.get("abv") || undefined,
      brewery: formData.get("brewery") || undefined,
      beerStyle: formData.get("beerStyle") || undefined,
      ibu: formData.get("ibu") || undefined,
    };

    const validated = inventoryItemSchema.safeParse(raw);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    // Prevent assigning items to SUPER categories
    if (validated.data.categoryId) {
      const targetCategory = await prisma.category.findUnique({
        where: { id: validated.data.categoryId },
      });
      if (targetCategory?.type === "SUPER") {
        return {
          success: false,
          error: "Items cannot be assigned to a super category. Choose a category or subcategory.",
        };
      }
    }

    const item = await prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.create({
        data: {
          name: validated.data.name,
          sku: validated.data.sku,
          description: validated.data.description,
          categoryId: validated.data.categoryId || null,
          unit: validated.data.unit as UnitType,
          unitCost: validated.data.unitCost,
          parLevel: validated.data.parLevel,
          maxLevel: validated.data.maxLevel,
          storageTemp: validated.data.storageTemp,
          shelfLifeDays: validated.data.shelfLifeDays,
          notes: validated.data.notes,
          glCode: validated.data.glCode,
          locationId: validated.data.locationId,
          vintage: validated.data.vintage,
          binNumber: validated.data.binNumber,
          varietal: validated.data.varietal,
          region: validated.data.region,
          producer: validated.data.producer,
          abv: validated.data.abv,
          brewery: validated.data.brewery,
          beerStyle: validated.data.beerStyle,
          ibu: validated.data.ibu,
        },
      });

      await tx.stockLevel.create({
        data: {
          inventoryItemId: item.id,
          locationId: validated.data.locationId,
          quantity: 0,
        },
      });

      return item;
    });

    revalidatePath("/inventory");
    revalidatePath("/dashboard");
    return { success: true, data: { id: item.id } };
  } catch {
    return { success: false, error: "Failed to create inventory item" };
  }
}

export async function updateInventoryItem(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireRole(["ADMIN", "MANAGER"]);

    const raw = {
      name: formData.get("name"),
      sku: formData.get("sku") || undefined,
      description: formData.get("description") || undefined,
      categoryId: formData.get("categoryId") || undefined,
      unit: formData.get("unit"),
      unitCost: formData.get("unitCost"),
      parLevel: formData.get("parLevel"),
      maxLevel: formData.get("maxLevel") || undefined,
      storageTemp: formData.get("storageTemp") || undefined,
      shelfLifeDays: formData.get("shelfLifeDays") || undefined,
      notes: formData.get("notes") || undefined,
      glCode: formData.get("glCode") || undefined,
      locationId: formData.get("locationId"),
      vintage: formData.get("vintage") || undefined,
      binNumber: formData.get("binNumber") || undefined,
      varietal: formData.get("varietal") || undefined,
      region: formData.get("region") || undefined,
      producer: formData.get("producer") || undefined,
      abv: formData.get("abv") || undefined,
      brewery: formData.get("brewery") || undefined,
      beerStyle: formData.get("beerStyle") || undefined,
      ibu: formData.get("ibu") || undefined,
    };

    const validated = inventoryItemSchema.safeParse(raw);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    // Prevent assigning items to SUPER categories
    if (validated.data.categoryId) {
      const targetCategory = await prisma.category.findUnique({
        where: { id: validated.data.categoryId },
      });
      if (targetCategory?.type === "SUPER") {
        return {
          success: false,
          error: "Items cannot be assigned to a super category. Choose a category or subcategory.",
        };
      }
    }

    const existing = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Item not found" };
    }

    await prisma.$transaction(async (tx) => {
      // Track price changes
      if (Number(existing.unitCost) !== validated.data.unitCost) {
        const user = await requireAuth();
        await tx.priceHistory.create({
          data: {
            inventoryItemId: id,
            oldPrice: existing.unitCost,
            newPrice: validated.data.unitCost,
            changedBy: user.id,
          },
        });
      }

      await tx.inventoryItem.update({
        where: { id },
        data: {
          name: validated.data.name,
          sku: validated.data.sku,
          description: validated.data.description,
          categoryId: validated.data.categoryId || null,
          unit: validated.data.unit as UnitType,
          unitCost: validated.data.unitCost,
          parLevel: validated.data.parLevel,
          maxLevel: validated.data.maxLevel,
          storageTemp: validated.data.storageTemp,
          shelfLifeDays: validated.data.shelfLifeDays,
          notes: validated.data.notes,
          glCode: validated.data.glCode,
          vintage: validated.data.vintage,
          binNumber: validated.data.binNumber,
          varietal: validated.data.varietal,
          region: validated.data.region,
          producer: validated.data.producer,
          abv: validated.data.abv,
          brewery: validated.data.brewery,
          beerStyle: validated.data.beerStyle,
          ibu: validated.data.ibu,
        },
      });
    });

    revalidatePath("/inventory");
    revalidatePath(`/inventory/${id}`);
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Failed to update inventory item" };
  }
}

export async function deleteInventoryItem(
  id: string
): Promise<ActionResult> {
  try {
    await requireRole(["ADMIN", "MANAGER"]);

    await prisma.inventoryItem.delete({ where: { id } });

    revalidatePath("/inventory");
    revalidatePath("/dashboard");
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Failed to delete inventory item" };
  }
}

export async function adjustStock(
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireAuth();

    const raw = {
      inventoryItemId: formData.get("inventoryItemId"),
      locationId: formData.get("locationId"),
      quantity: formData.get("quantity"),
      reason: formData.get("reason"),
    };

    const validated = stockAdjustmentSchema.safeParse(raw);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const user = await requireAuth();

    await prisma.$transaction(async (tx) => {
      const stockLevel = await tx.stockLevel.findUnique({
        where: {
          inventoryItemId_locationId: {
            inventoryItemId: validated.data.inventoryItemId,
            locationId: validated.data.locationId,
          },
        },
      });

      const currentQty = stockLevel ? Number(stockLevel.quantity) : 0;
      const newQty = currentQty + validated.data.quantity;

      if (newQty < 0) {
        throw new Error("Stock cannot go below 0");
      }

      await tx.stockLevel.upsert({
        where: {
          inventoryItemId_locationId: {
            inventoryItemId: validated.data.inventoryItemId,
            locationId: validated.data.locationId,
          },
        },
        create: {
          inventoryItemId: validated.data.inventoryItemId,
          locationId: validated.data.locationId,
          quantity: validated.data.quantity,
          lastCountedAt: new Date(),
          lastCountedBy: user.id,
        },
        update: {
          quantity: newQty,
          lastCountedAt: new Date(),
          lastCountedBy: user.id,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id!,
          action: "ADJUST_STOCK",
          entityType: "InventoryItem",
          entityId: validated.data.inventoryItemId,
          details: {
            previousQuantity: currentQty,
            adjustment: validated.data.quantity,
            newQuantity: newQty,
            reason: validated.data.reason,
          },
        },
      });
    });

    revalidatePath("/inventory");
    revalidatePath(`/inventory/${validated.data.inventoryItemId}`);
    revalidatePath("/dashboard");
    return { success: true, data: undefined };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to adjust stock";
    return { success: false, error: message };
  }
}
