"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/helpers";
import { wasteLogSchema } from "@/lib/validators/waste";

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function getWasteLogs(locationId?: string) {
  return prisma.wasteLog.findMany({
    where: locationId ? { locationId } : undefined,
    include: {
      inventoryItem: { include: { category: true } },
      location: true,
      loggedBy: { select: { name: true, email: true } },
    },
    orderBy: { wastedAt: "desc" },
  });
}

export async function createWasteLog(
  data: Record<string, unknown>
): Promise<ActionResult> {
  try {
    const user = await requireAuth();

    const validated = wasteLogSchema.safeParse(data);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const item = await prisma.inventoryItem.findUnique({
      where: { id: validated.data.inventoryItemId },
    });
    if (!item) return { success: false, error: "Item not found" };

    const unitCost = Number(item.unitCost);
    const totalCost = validated.data.quantity * unitCost;

    await prisma.$transaction(async (tx) => {
      // Create waste log
      await tx.wasteLog.create({
        data: {
          inventoryItemId: validated.data.inventoryItemId,
          locationId: validated.data.locationId,
          quantity: validated.data.quantity,
          unitCost,
          totalCost,
          reason: validated.data.reason,
          notes: validated.data.notes,
          loggedById: user.id!,
        },
      });

      // Deduct from stock
      const stockLevel = await tx.stockLevel.findUnique({
        where: {
          inventoryItemId_locationId: {
            inventoryItemId: validated.data.inventoryItemId,
            locationId: validated.data.locationId,
          },
        },
      });

      const currentQty = stockLevel ? Number(stockLevel.quantity) : 0;
      const newQty = Math.max(0, currentQty - validated.data.quantity);

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
          quantity: 0,
        },
        update: {
          quantity: newQty,
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: user.id!,
          action: "LOG_WASTE",
          entityType: "InventoryItem",
          entityId: validated.data.inventoryItemId,
          details: {
            quantity: validated.data.quantity,
            reason: validated.data.reason,
            totalCost,
            previousStock: currentQty,
            newStock: newQty,
          },
        },
      });
    });

    revalidatePath("/waste");
    revalidatePath("/inventory");
    revalidatePath("/dashboard");
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Failed to log waste" };
  }
}
