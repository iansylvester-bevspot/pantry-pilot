"use server";

import { prisma } from "@/lib/prisma";

export async function getInventoryValueReport() {
  const items = await prisma.inventoryItem.findMany({
    where: { isActive: true },
    include: {
      category: true,
      stockLevels: true,
    },
  });

  return items.map((item) => {
    const totalStock = item.stockLevels.reduce(
      (sum, sl) => sum + Number(sl.quantity),
      0
    );
    const totalValue = totalStock * Number(item.unitCost);

    return {
      id: item.id,
      name: item.name,
      category: item.category.name,
      categoryColor: item.category.color,
      unit: item.unit,
      unitCost: Number(item.unitCost),
      totalStock,
      totalValue,
      parLevel: Number(item.parLevel),
    };
  });
}

export async function getWasteReport(days: number = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const logs = await prisma.wasteLog.findMany({
    where: { wastedAt: { gte: since } },
    include: {
      inventoryItem: { include: { category: true } },
      location: true,
    },
    orderBy: { wastedAt: "desc" },
  });

  // Group by reason
  const byReason: Record<string, { count: number; cost: number }> = {};
  for (const log of logs) {
    if (!byReason[log.reason]) {
      byReason[log.reason] = { count: 0, cost: 0 };
    }
    byReason[log.reason].count += 1;
    byReason[log.reason].cost += Number(log.totalCost);
  }

  // Group by category
  const byCategory: Record<string, { count: number; cost: number }> = {};
  for (const log of logs) {
    const cat = log.inventoryItem.category.name;
    if (!byCategory[cat]) {
      byCategory[cat] = { count: 0, cost: 0 };
    }
    byCategory[cat].count += 1;
    byCategory[cat].cost += Number(log.totalCost);
  }

  const totalCost = logs.reduce((sum, l) => sum + Number(l.totalCost), 0);

  return {
    totalLogs: logs.length,
    totalCost,
    byReason: Object.entries(byReason).map(([reason, data]) => ({
      reason,
      ...data,
    })),
    byCategory: Object.entries(byCategory).map(([category, data]) => ({
      category,
      ...data,
    })),
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
