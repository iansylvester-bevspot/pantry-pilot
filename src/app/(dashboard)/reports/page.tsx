import Link from "next/link";
import { getInventoryValueReport, getWasteReport, getOrdersReport } from "@/actions/reports";
import PageHeader from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const REASON_LABELS: Record<string, string> = {
  EXPIRED: "Expired",
  SPOILED: "Spoiled",
  DAMAGED: "Damaged",
  OVERPRODUCTION: "Overproduction",
  CONTAMINATED: "Contaminated",
  PREP_WASTE: "Prep Waste",
  CUSTOMER_RETURN: "Customer Return",
  OTHER: "Other",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  APPROVED: "Approved",
  ORDERED: "Ordered",
  PARTIALLY_RECEIVED: "Partially Received",
  RECEIVED: "Received",
  CANCELLED: "Cancelled",
};

export default async function ReportsPage() {
  const [inventory, waste, orders] = await Promise.all([
    getInventoryValueReport(),
    getWasteReport(30),
    getOrdersReport(),
  ]);

  const totalInventoryValue = inventory.reduce((sum, i) => sum + i.totalValue, 0);

  // Group inventory by category for summary
  const categoryValues: Record<string, number> = {};
  for (const item of inventory) {
    categoryValues[item.category] = (categoryValues[item.category] ?? 0) + item.totalValue;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Overview of inventory, spending, and waste analytics"
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalInventoryValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              across {inventory.length} items
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Waste (30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              ${waste.totalCost.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {waste.totalLogs} waste entries
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Order Spend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${orders.totalSpend.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {orders.totalOrders} purchase orders
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Value by Category */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Value by Category</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(categoryValues).length === 0 ? (
            <p className="text-sm text-muted-foreground">No inventory data yet.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(categoryValues)
                .sort(([, a], [, b]) => b - a)
                .map(([category, value]) => {
                  const pct = totalInventoryValue > 0
                    ? (value / totalInventoryValue) * 100
                    : 0;
                  return (
                    <div key={category} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{category}</span>
                        <span className="font-medium">${value.toFixed(2)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Waste by Reason */}
        <Card>
          <CardHeader>
            <CardTitle>Waste by Reason (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            {waste.byReason.length === 0 ? (
              <p className="text-sm text-muted-foreground">No waste data yet.</p>
            ) : (
              <div className="space-y-3">
                {waste.byReason
                  .sort((a, b) => b.cost - a.cost)
                  .map((entry) => (
                    <div
                      key={entry.reason}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {REASON_LABELS[entry.reason] ?? entry.reason}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {entry.count} entries
                        </span>
                      </div>
                      <span className="text-sm font-medium text-destructive">
                        ${entry.cost.toFixed(2)}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Waste by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Waste by Category (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            {waste.byCategory.length === 0 ? (
              <p className="text-sm text-muted-foreground">No waste data yet.</p>
            ) : (
              <div className="space-y-3">
                {waste.byCategory
                  .sort((a, b) => b.cost - a.cost)
                  .map((entry) => (
                    <div
                      key={entry.category}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <span className="text-sm">{entry.category}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          ({entry.count} entries)
                        </span>
                      </div>
                      <span className="text-sm font-medium text-destructive">
                        ${entry.cost.toFixed(2)}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Orders by Supplier */}
      <Card>
        <CardHeader>
          <CardTitle>Spending by Supplier</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.bySupplier.length === 0 ? (
            <p className="text-sm text-muted-foreground">No order data yet.</p>
          ) : (
            <div className="space-y-3">
              {orders.bySupplier.map((entry) => {
                const pct = orders.totalSpend > 0
                  ? (entry.total / orders.totalSpend) * 100
                  : 0;
                return (
                  <div key={entry.supplier} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>
                        {entry.supplier}{" "}
                        <span className="text-muted-foreground">
                          ({entry.count} orders)
                        </span>
                      </span>
                      <span className="font-medium">${entry.total.toFixed(2)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Orders by Status</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.byStatus.length === 0 ? (
            <p className="text-sm text-muted-foreground">No order data yet.</p>
          ) : (
            <div className="flex flex-wrap gap-4">
              {orders.byStatus.map((entry) => (
                <div
                  key={entry.status}
                  className="rounded-lg border p-3 text-center min-w-[120px]"
                >
                  <p className="text-2xl font-bold">{entry.count}</p>
                  <p className="text-xs text-muted-foreground">
                    {STATUS_LABELS[entry.status] ?? entry.status}
                  </p>
                  <p className="text-sm font-medium mt-1">
                    ${entry.total.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
