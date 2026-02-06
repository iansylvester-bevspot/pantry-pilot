import { prisma } from "@/lib/prisma";
import { getLocations } from "@/actions/locations";
import PageHeader from "@/components/shared/page-header";
import OrderForm from "@/components/orders/order-form";

export default async function NewOrderPage() {
  const [suppliers, locations] = await Promise.all([
    prisma.supplier.findMany({
      where: { isActive: true },
      include: {
        supplierItems: {
          include: {
            inventoryItem: { select: { id: true, name: true, unit: true } },
          },
        },
      },
      orderBy: { name: "asc" },
    }),
    getLocations(),
  ]);

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="New Purchase Order"
        description="Create a new purchase order for a supplier"
      />
      <OrderForm suppliers={suppliers} locations={locations} />
    </div>
  );
}
