import Link from "next/link";
import { getPurchaseOrders } from "@/actions/orders";
import PageHeader from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Plus, ClipboardList } from "lucide-react";
import EmptyState from "@/components/shared/empty-state";
import OrderTable from "@/components/orders/order-table";

export default async function OrdersPage() {
  const orders = await getPurchaseOrders();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase Orders"
        description="Manage purchase orders and receiving"
      >
        <Button asChild>
          <Link href="/orders/new">
            <Plus className="mr-2 h-4 w-4" />
            New Order
          </Link>
        </Button>
      </PageHeader>

      {orders.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-12 w-12" />}
          title="No purchase orders yet"
          description="Create your first purchase order to start tracking supplier orders."
        >
          <Button asChild>
            <Link href="/orders/new">Create Order</Link>
          </Button>
        </EmptyState>
      ) : (
        <OrderTable orders={orders} />
      )}
    </div>
  );
}
