"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth, requireRole } from "@/lib/auth/helpers";
import { purchaseOrderSchema } from "@/lib/validators/orders";
import { PurchaseOrderStatus } from "@/generated/prisma/client";

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

function generateOrderNumber(): string {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const rand = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
  return `PO-${y}${m}${d}-${rand}`;
}

export async function getPurchaseOrders(locationId?: string) {
  return prisma.purchaseOrder.findMany({
    where: locationId ? { locationId } : undefined,
    include: {
      supplier: true,
      location: true,
      createdBy: { select: { name: true, email: true } },
      _count: { select: { lines: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPurchaseOrder(id: string) {
  return prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      supplier: true,
      location: true,
      createdBy: { select: { name: true, email: true } },
      approvedBy: { select: { name: true, email: true } },
      lines: {
        include: {
          inventoryItem: { include: { category: true } },
        },
      },
    },
  });
}

export async function createPurchaseOrder(
  data: Record<string, unknown>
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireRole(["ADMIN", "MANAGER"]);
    const user = await requireAuth();

    const validated = purchaseOrderSchema.safeParse(data);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const { lines, expectedDate, ...rest } = validated.data;

    const subtotal = lines.reduce(
      (sum, line) => sum + line.quantityOrdered * line.unitCost,
      0
    );

    const po = await prisma.purchaseOrder.create({
      data: {
        orderNumber: generateOrderNumber(),
        ...rest,
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        subtotal,
        totalAmount: subtotal,
        createdById: user.id!,
        lines: {
          create: lines.map((line) => ({
            inventoryItemId: line.inventoryItemId,
            quantityOrdered: line.quantityOrdered,
            unitCost: line.unitCost,
            lineTotal: line.quantityOrdered * line.unitCost,
          })),
        },
      },
    });

    revalidatePath("/orders");
    return { success: true, data: { id: po.id } };
  } catch {
    return { success: false, error: "Failed to create purchase order" };
  }
}

export async function updatePurchaseOrderStatus(
  id: string,
  newStatus: PurchaseOrderStatus
): Promise<ActionResult> {
  try {
    const user = await requireAuth();

    const po = await prisma.purchaseOrder.findUnique({ where: { id } });
    if (!po) return { success: false, error: "Order not found" };

    // Validate status transitions
    const validTransitions: Record<string, PurchaseOrderStatus[]> = {
      DRAFT: ["SUBMITTED", "CANCELLED"],
      SUBMITTED: ["APPROVED", "CANCELLED"],
      APPROVED: ["ORDERED", "CANCELLED"],
      ORDERED: ["PARTIALLY_RECEIVED", "RECEIVED", "CANCELLED"],
      PARTIALLY_RECEIVED: ["RECEIVED", "CANCELLED"],
    };

    const allowed = validTransitions[po.status] ?? [];
    if (!allowed.includes(newStatus)) {
      return {
        success: false,
        error: `Cannot transition from ${po.status} to ${newStatus}`,
      };
    }

    // Role checks
    if (["SUBMITTED"].includes(newStatus)) {
      await requireRole(["ADMIN", "MANAGER"]);
    }
    if (["APPROVED"].includes(newStatus)) {
      await requireRole(["ADMIN", "MANAGER"]);
    }

    const updateData: Record<string, unknown> = { status: newStatus };

    if (newStatus === "APPROVED") {
      updateData.approvedById = user.id;
    }
    if (newStatus === "RECEIVED") {
      updateData.receivedDate = new Date();
    }

    await prisma.purchaseOrder.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/orders");
    revalidatePath(`/orders/${id}`);
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Failed to update order status" };
  }
}

export async function receivePurchaseOrderLines(
  orderId: string,
  receivedLines: { lineId: string; quantityReceived: number }[]
): Promise<ActionResult> {
  try {
    await requireAuth();

    const po = await prisma.purchaseOrder.findUnique({
      where: { id: orderId },
      include: { lines: { include: { inventoryItem: true } } },
    });

    if (!po) return { success: false, error: "Order not found" };

    if (!["ORDERED", "PARTIALLY_RECEIVED"].includes(po.status)) {
      return { success: false, error: "Order is not in a receivable status" };
    }

    await prisma.$transaction(async (tx) => {
      for (const rl of receivedLines) {
        const line = po.lines.find((l) => l.id === rl.lineId);
        if (!line) continue;

        const newReceived =
          Number(line.quantityReceived) + rl.quantityReceived;

        // Update the line's received quantity
        await tx.purchaseOrderLine.update({
          where: { id: rl.lineId },
          data: { quantityReceived: newReceived },
        });

        // Update stock level
        if (rl.quantityReceived > 0) {
          await tx.stockLevel.upsert({
            where: {
              inventoryItemId_locationId: {
                inventoryItemId: line.inventoryItemId,
                locationId: po.locationId,
              },
            },
            create: {
              inventoryItemId: line.inventoryItemId,
              locationId: po.locationId,
              quantity: rl.quantityReceived,
            },
            update: {
              quantity: { increment: rl.quantityReceived },
            },
          });

          // Track price changes if unit cost differs
          const currentItemCost = Number(line.inventoryItem.unitCost);
          const lineCost = Number(line.unitCost);
          if (currentItemCost !== lineCost) {
            const user = await requireAuth();
            await tx.priceHistory.create({
              data: {
                inventoryItemId: line.inventoryItemId,
                oldPrice: currentItemCost,
                newPrice: lineCost,
                changedBy: user.id,
              },
            });
            await tx.inventoryItem.update({
              where: { id: line.inventoryItemId },
              data: { unitCost: lineCost },
            });
          }
        }
      }

      // Determine if fully or partially received
      const updatedLines = await tx.purchaseOrderLine.findMany({
        where: { purchaseOrderId: orderId },
      });

      const allReceived = updatedLines.every(
        (l) => Number(l.quantityReceived) >= Number(l.quantityOrdered)
      );
      const someReceived = updatedLines.some(
        (l) => Number(l.quantityReceived) > 0
      );

      const newStatus: PurchaseOrderStatus = allReceived
        ? "RECEIVED"
        : someReceived
          ? "PARTIALLY_RECEIVED"
          : po.status;

      await tx.purchaseOrder.update({
        where: { id: orderId },
        data: {
          status: newStatus,
          ...(allReceived ? { receivedDate: new Date() } : {}),
        },
      });
    });

    revalidatePath("/orders");
    revalidatePath(`/orders/${orderId}`);
    revalidatePath("/inventory");
    revalidatePath("/dashboard");
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Failed to receive items" };
  }
}

export async function deletePurchaseOrder(id: string): Promise<ActionResult> {
  try {
    await requireRole(["ADMIN", "MANAGER"]);

    const po = await prisma.purchaseOrder.findUnique({ where: { id } });
    if (!po) return { success: false, error: "Order not found" };
    if (po.status !== "DRAFT") {
      return { success: false, error: "Only draft orders can be deleted" };
    }

    await prisma.purchaseOrder.delete({ where: { id } });

    revalidatePath("/orders");
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Failed to delete order" };
  }
}
