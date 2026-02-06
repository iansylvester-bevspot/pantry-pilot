import Link from "next/link";
import { getDashboardStats } from "@/actions/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, AlertTriangle, Truck, TrendingDown, MapPin, Users } from "lucide-react";

const ACTION_LABELS: Record<string, string> = {
  ADJUST_STOCK: "Stock adjusted",
  LOG_WASTE: "Waste logged",
  CREATE: "Created",
  UPDATE: "Updated",
  DELETE: "Deleted",
};

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalItems}</div>
            <p className="text-xs text-muted-foreground">inventory items tracked</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.lowStockCount}</div>
            <p className="text-xs text-muted-foreground">items below par level</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeOrders}</div>
            <p className="text-xs text-muted-foreground">purchase orders in progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Waste (30d)</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.wasteLastMonth.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">in wasted inventory</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="text-center">
          <CardContent className="pt-6">
            <MapPin className="mx-auto h-6 w-6 text-muted-foreground mb-2" />
            <div className="text-2xl font-bold">{stats.totalLocations}</div>
            <p className="text-xs text-muted-foreground">Locations</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-6">
            <Users className="mx-auto h-6 w-6 text-muted-foreground mb-2" />
            <div className="text-2xl font-bold">{stats.totalSuppliers}</div>
            <p className="text-xs text-muted-foreground">Suppliers</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-6">
            <Package className="mx-auto h-6 w-6 text-muted-foreground mb-2" />
            <div className="text-2xl font-bold">{stats.totalItems}</div>
            <p className="text-xs text-muted-foreground">Inventory Items</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Low Stock Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.lowStockItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No low stock items. Looking good!
              </p>
            ) : (
              <div className="space-y-3">
                {stats.lowStockItems.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <Link
                        href={`/inventory/${item.id}`}
                        className="text-sm font-medium hover:underline"
                      >
                        {item.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {item.category}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="destructive">
                        {item.totalStock} / {item.parLevel} {item.unit.toLowerCase()}
                      </Badge>
                    </div>
                  </div>
                ))}
                {stats.lowStockItems.length > 5 && (
                  <Link
                    href="/inventory"
                    className="text-sm text-muted-foreground hover:underline"
                  >
                    View all {stats.lowStockItems.length} low stock items...
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No recent activity yet. Start by adding inventory items.
              </p>
            ) : (
              <div className="space-y-3">
                {stats.recentActivity.map((log) => (
                  <div key={log.id} className="flex items-start justify-between">
                    <div>
                      <p className="text-sm">
                        {ACTION_LABELS[log.action] ?? log.action}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {log.user.name ?? log.user.email} &middot;{" "}
                        {log.entityType}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
