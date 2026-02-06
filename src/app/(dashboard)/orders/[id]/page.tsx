import { notFound } from "next/navigation";
import Link from "next/link";
import { getPurchaseOrder } from "@/actions/orders";
import PageHeader from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import OrderStatusBadge from "@/components/orders/order-status-badge";
import OrderActions from "@/components/orders/order-actions";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getPurchaseOrder(id);

  if (!order) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={order.orderNumber}
        description={`Order from ${order.supplier.name}`}
      >
        <OrderStatusBadge status={order.status} />
      </PageHeader>

      <OrderActions
        orderId={order.id}
        status={order.status}
        lines={order.lines}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Supplier</CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              href={`/suppliers/${order.supplier.id}`}
              className="font-medium hover:underline"
            >
              {order.supplier.name}
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Location</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{order.location.name}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ${Number(order.totalAmount).toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="pt-6 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created by</span>
              <span>{order.createdBy.name ?? order.createdBy.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created</span>
              <span>{new Date(order.createdAt).toLocaleDateString()}</span>
            </div>
            {order.approvedBy && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Approved by</span>
                <span>
                  {order.approvedBy.name ?? order.approvedBy.email}
                </span>
              </div>
            )}
            {order.expectedDate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expected</span>
                <span>
                  {new Date(order.expectedDate).toLocaleDateString()}
                </span>
              </div>
            )}
            {order.receivedDate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Received</span>
                <span>
                  {new Date(order.receivedDate).toLocaleDateString()}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
        {order.notes && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-1">Notes</p>
              <p className="text-sm whitespace-pre-wrap">{order.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 font-medium">Item</th>
                  <th className="pb-2 font-medium text-right">Ordered</th>
                  <th className="pb-2 font-medium text-right">Received</th>
                  <th className="pb-2 font-medium text-right">Unit Cost</th>
                  <th className="pb-2 font-medium text-right">Line Total</th>
                </tr>
              </thead>
              <tbody>
                {order.lines.map((line) => (
                  <tr key={line.id} className="border-b last:border-0">
                    <td className="py-3">
                      <Link
                        href={`/inventory/${line.inventoryItemId}`}
                        className="hover:underline"
                      >
                        {line.inventoryItem.name}
                      </Link>
                    </td>
                    <td className="py-3 text-right">
                      {Number(line.quantityOrdered)}
                    </td>
                    <td className="py-3 text-right">
                      {Number(line.quantityReceived)}
                    </td>
                    <td className="py-3 text-right">
                      ${Number(line.unitCost).toFixed(2)}
                    </td>
                    <td className="py-3 text-right font-medium">
                      ${Number(line.lineTotal).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t">
                  <td colSpan={4} className="pt-3 text-right font-medium">
                    Subtotal
                  </td>
                  <td className="pt-3 text-right font-bold">
                    ${Number(order.subtotal).toFixed(2)}
                  </td>
                </tr>
                {Number(order.tax) > 0 && (
                  <tr>
                    <td colSpan={4} className="pt-1 text-right text-muted-foreground">
                      Tax
                    </td>
                    <td className="pt-1 text-right">
                      ${Number(order.tax).toFixed(2)}
                    </td>
                  </tr>
                )}
                {Number(order.shippingCost) > 0 && (
                  <tr>
                    <td colSpan={4} className="pt-1 text-right text-muted-foreground">
                      Shipping
                    </td>
                    <td className="pt-1 text-right">
                      ${Number(order.shippingCost).toFixed(2)}
                    </td>
                  </tr>
                )}
                <tr>
                  <td colSpan={4} className="pt-2 text-right text-lg font-bold">
                    Total
                  </td>
                  <td className="pt-2 text-right text-lg font-bold">
                    ${Number(order.totalAmount).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
