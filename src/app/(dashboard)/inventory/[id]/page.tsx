import { notFound } from "next/navigation";
import Link from "next/link";
import { getInventoryItem } from "@/actions/inventory";
import PageHeader from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StockLevelBadge from "@/components/inventory/stock-level-badge";
import { Pencil } from "lucide-react";
import ItemStockActions from "@/components/inventory/item-stock-actions";
import { CategoryBreadcrumb } from "@/components/categories/category-breadcrumb";
import { GlCodeBadge } from "@/components/categories/gl-code-badge";

export default async function InventoryItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getInventoryItem(id);

  if (!item) notFound();

  const totalStock = item.stockLevels.reduce(
    (sum, sl) => sum + Number(sl.quantity),
    0
  );

  return (
    <div className="space-y-6">
      <PageHeader title={item.name} description={item.description ?? undefined}>
        <Button variant="outline" asChild>
          <Link href={`/inventory/${item.id}/edit`}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalStock} {item.unit.toLowerCase()}
            </div>
            <StockLevelBadge
              quantity={totalStock}
              parLevel={Number(item.parLevel)}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Unit Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${Number(item.unitCost).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">per {item.unit.toLowerCase()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Category</CardTitle>
          </CardHeader>
          <CardContent>
            {item.category ? (
              <>
                <CategoryBreadcrumb category={item.category} />
                <div className="mt-2 flex items-center gap-2">
                  <GlCodeBadge
                    itemGlCode={item.glCode}
                    category={item.category}
                  />
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Uncategorized</p>
            )}
            <div className="mt-2 text-sm text-muted-foreground">
              Par: {Number(item.parLevel)} | Max: {item.maxLevel ? Number(item.maxLevel) : "—"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stock by Location</CardTitle>
        </CardHeader>
        <CardContent>
          {item.stockLevels.length === 0 ? (
            <p className="text-sm text-muted-foreground">No stock records.</p>
          ) : (
            <div className="space-y-3">
              {item.stockLevels.map((sl) => (
                <div
                  key={sl.locationId}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{sl.location.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {Number(sl.quantity)} {item.unit.toLowerCase()}
                    </p>
                  </div>
                  <ItemStockActions
                    itemId={item.id}
                    itemName={item.name}
                    locationId={sl.locationId}
                    currentQuantity={Number(sl.quantity)}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {item.supplierItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Suppliers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {item.supplierItems.map((si) => (
                <div
                  key={si.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{si.supplier.name}</p>
                    {si.supplierSku && (
                      <p className="text-sm text-muted-foreground">
                        SKU: {si.supplierSku}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${Number(si.unitCost).toFixed(2)}</p>
                    {si.isPreferred && <Badge>Preferred</Badge>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {item.priceHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Price History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {item.priceHistory.map((ph) => (
                <div
                  key={ph.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-muted-foreground">
                    {new Date(ph.changedAt).toLocaleDateString()}
                  </span>
                  <span>
                    ${Number(ph.oldPrice).toFixed(2)} → ${Number(ph.newPrice).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {item.storageTemp && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Storage</p>
              <p className="font-medium">{item.storageTemp}</p>
            </CardContent>
          </Card>
        )}
        {item.shelfLifeDays && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Shelf Life</p>
              <p className="font-medium">{item.shelfLifeDays} days</p>
            </CardContent>
          </Card>
        )}
      </div>

      {(item.vintage || item.producer || item.varietal || item.region || item.binNumber || item.abv) && (
        <Card>
          <CardHeader>
            <CardTitle>Wine Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {item.producer && (
                <div>
                  <p className="text-sm text-muted-foreground">Producer</p>
                  <p className="font-medium">{item.producer}</p>
                </div>
              )}
              {item.varietal && (
                <div>
                  <p className="text-sm text-muted-foreground">Varietal</p>
                  <p className="font-medium">{item.varietal}</p>
                </div>
              )}
              {item.vintage && (
                <div>
                  <p className="text-sm text-muted-foreground">Vintage</p>
                  <p className="font-medium">{item.vintage}</p>
                </div>
              )}
              {item.region && (
                <div>
                  <p className="text-sm text-muted-foreground">Region</p>
                  <p className="font-medium">{item.region}</p>
                </div>
              )}
              {item.binNumber && (
                <div>
                  <p className="text-sm text-muted-foreground">Bin Number</p>
                  <p className="font-medium">{item.binNumber}</p>
                </div>
              )}
              {item.abv && (
                <div>
                  <p className="text-sm text-muted-foreground">ABV</p>
                  <p className="font-medium">{Number(item.abv)}%</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
