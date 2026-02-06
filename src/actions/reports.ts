"use server";

import { prisma } from "@/lib/prisma";

/** Resolve the super category (top-level ancestor) for a category chain */
function resolveSuperCategory(category: {
  name: string;
  type: string;
  parent?: { name: string; type: string; parent?: { name: string; type: string } | null } | null;
}): string {
  if (category.type === "SUPER") return category.name;
  if (category.parent?.type === "SUPER") return category.parent.name;
  if (category.parent?.parent?.type === "SUPER") return category.parent.parent.name;
  return "Unassigned";
}

/** Build a category breadcrumb like "Food > Produce > Leafy Greens" */
function categoryBreadcrumb(category: {
  name: string;
  parent?: { name: string; parent?: { name: string } | null } | null;
}): string {
  const parts: string[] = [];
  if (category.parent?.parent) parts.push(category.parent.parent.name);
  if (category.parent) parts.push(category.parent.name);
  parts.push(category.name);
  return parts.join(" > ");
}

export async function getInventoryValueReport(superCategoryId?: string) {
  const items = await prisma.inventoryItem.findMany({
    where: { isActive: true },
    include: {
      category: { include: { parent: { include: { parent: true } } } },
      stockLevels: true,
    },
  });

  const mapped = items.map((item) => {
    const totalStock = item.stockLevels.reduce(
      (sum, sl) => sum + Number(sl.quantity),
      0
    );
    const totalValue = totalStock * Number(item.unitCost);
    const superCategory = item.category
      ? resolveSuperCategory(item.category)
      : "Uncategorized";

    return {
      id: item.id,
      name: item.name,
      category: item.category
        ? categoryBreadcrumb(item.category)
        : "Uncategorized",
      categoryColor: item.category?.color ?? null,
      superCategory,
      unit: item.unit,
      unitCost: Number(item.unitCost),
      totalStock,
      totalValue,
      parLevel: Number(item.parLevel),
    };
  });

  // Filter by super category if specified
  if (superCategoryId) {
    const superCat = await prisma.category.findUnique({
      where: { id: superCategoryId },
    });
    if (superCat) {
      return mapped.filter((item) => item.superCategory === superCat.name);
    }
  }

  return mapped;
}

export async function getWasteReport(days: number = 30, superCategoryId?: string) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const logs = await prisma.wasteLog.findMany({
    where: { wastedAt: { gte: since } },
    include: {
      inventoryItem: {
        include: {
          category: { include: { parent: { include: { parent: true } } } },
        },
      },
      location: true,
    },
    orderBy: { wastedAt: "desc" },
  });

  // Optional filter by super category
  const filteredLogs = superCategoryId
    ? await (async () => {
        const superCat = await prisma.category.findUnique({
          where: { id: superCategoryId },
        });
        if (!superCat) return logs;
        return logs.filter(
          (log) =>
            log.inventoryItem.category &&
            resolveSuperCategory(log.inventoryItem.category) === superCat.name
        );
      })()
    : logs;

  // Group by reason
  const byReason: Record<string, { count: number; cost: number }> = {};
  for (const log of filteredLogs) {
    if (!byReason[log.reason]) {
      byReason[log.reason] = { count: 0, cost: 0 };
    }
    byReason[log.reason].count += 1;
    byReason[log.reason].cost += Number(log.totalCost);
  }

  // Group by category (breadcrumb)
  const byCategory: Record<string, { count: number; cost: number }> = {};
  for (const log of filteredLogs) {
    const cat = log.inventoryItem.category
      ? categoryBreadcrumb(log.inventoryItem.category)
      : "Uncategorized";
    if (!byCategory[cat]) {
      byCategory[cat] = { count: 0, cost: 0 };
    }
    byCategory[cat].count += 1;
    byCategory[cat].cost += Number(log.totalCost);
  }

  // Group by super category
  const bySuperCategory: Record<string, { count: number; cost: number }> = {};
  for (const log of filteredLogs) {
    const superCat = log.inventoryItem.category
      ? resolveSuperCategory(log.inventoryItem.category)
      : "Uncategorized";
    if (!bySuperCategory[superCat]) {
      bySuperCategory[superCat] = { count: 0, cost: 0 };
    }
    bySuperCategory[superCat].count += 1;
    bySuperCategory[superCat].cost += Number(log.totalCost);
  }

  const totalCost = filteredLogs.reduce(
    (sum, l) => sum + Number(l.totalCost),
    0
  );

  return {
    totalLogs: filteredLogs.length,
    totalCost,
    byReason: Object.entries(byReason).map(([reason, data]) => ({
      reason,
      ...data,
    })),
    byCategory: Object.entries(byCategory).map(([category, data]) => ({
      category,
      ...data,
    })),
    bySuperCategory: Object.entries(bySuperCategory).map(
      ([superCategory, data]) => ({
        superCategory,
        ...data,
      })
    ),
  };
}

export async function getOrdersReport() {
  const orders = await prisma.purchaseOrder.findMany({
    include: {
      supplier: true,
      location: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Group by status
  const byStatus: Record<string, { count: number; total: number }> = {};
  for (const order of orders) {
    if (!byStatus[order.status]) {
      byStatus[order.status] = { count: 0, total: 0 };
    }
    byStatus[order.status].count += 1;
    byStatus[order.status].total += Number(order.totalAmount);
  }

  // Group by supplier
  const bySupplier: Record<string, { count: number; total: number }> = {};
  for (const order of orders) {
    const name = order.supplier.name;
    if (!bySupplier[name]) {
      bySupplier[name] = { count: 0, total: 0 };
    }
    bySupplier[name].count += 1;
    bySupplier[name].total += Number(order.totalAmount);
  }

  const totalSpend = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);

  return {
    totalOrders: orders.length,
    totalSpend,
    byStatus: Object.entries(byStatus).map(([status, data]) => ({
      status,
      ...data,
    })),
    bySupplier: Object.entries(bySupplier)
      .map(([supplier, data]) => ({ supplier, ...data }))
      .sort((a, b) => b.total - a.total),
  };
}

/** Get all super categories for filter tabs */
export async function getSuperCategories() {
  return prisma.category.findMany({
    where: { type: "SUPER" },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true },
  });
}
