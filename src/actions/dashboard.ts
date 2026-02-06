"use server";

import { prisma } from "@/lib/prisma";

export async function getDashboardStats() {
  const [
    totalItems,
    totalLocations,
    totalSuppliers,
    activeOrders,
    recentWaste,
    recentActivity,
  ] = await Promise.all([
    prisma.inventoryItem.count({ where: { isActive: true } }),
    prisma.location.count({ where: { isActive: true } }),
    prisma.supplier.count({ where: { isActive: true } }),
    prisma.purchaseOrder.count({
      where: { status: { in: ["DRAFT", "SUBMITTED", "APPROVED", "ORDERED", "PARTIALLY_RECEIVED"] } },
    }),
    prisma.wasteLog.aggregate({
      _sum: { totalCost: true },
      where: {
        wastedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, email: true } } },
    }),
  ]);

  // Low stock items
  const items = await prisma.inventoryItem.findMany({
    where: { isActive: true },
    include: {
      stockLevels: true,
      category: { include: { parent: { include: { parent: true } } } },
    },
  });

  const lowStockItems = items.filter((item) => {
    const total = item.stockLevels.reduce((sum, sl) => sum + Number(sl.quantity), 0);
    return total < Number(item.parLevel);
  });

  return {
    totalItems,
    totalLocations,
    totalSuppliers,
    activeOrders,
    lowStockCount: lowStockItems.length,
    lowStockItems: lowStockItems.map((item) => ({
      id: item.id,
      name: item.name,
      category: [
        item.category.parent?.parent?.name,
        item.category.parent?.name,
        item.category.name,
      ]
        .filter(Boolean)
        .join(" > "),
      totalStock: item.stockLevels.reduce((sum, sl) => sum + Number(sl.quantity), 0),
      parLevel: Number(item.parLevel),
      unit: item.unit,
    })),
    wasteLastMonth: Number(recentWaste._sum.totalCost ?? 0),
    recentActivity,
  };
}
