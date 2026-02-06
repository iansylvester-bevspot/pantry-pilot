import { notFound } from "next/navigation";
import Link from "next/link";
import { getSupplier } from "@/actions/suppliers";
import { getInventoryItems } from "@/actions/inventory";
import PageHeader from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pencil, Globe, Mail, Phone, MapPin } from "lucide-react";
import {
  LinkItemButton,
  UnlinkItemButton,
} from "@/components/suppliers/supplier-detail-actions";

export default async function SupplierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [supplier, items] = await Promise.all([
    getSupplier(id),
    getInventoryItems(),
  ]);

  if (!supplier) notFound();

  const existingItemIds = supplier.supplierItems.map(
    (si) => si.inventoryItemId
  );

  const inventoryItems = items.map((item) => ({
    id: item.id,
    name: item.name,
    sku: item.sku,
    category: { name: item.category?.name ?? "Uncategorized" },
  }));

  return (
    <div className="space-y-6">
      <PageHeader title={supplier.name} description={supplier.contactName ?? undefined}>
        <Button variant="outline" asChild>
          <Link href={`/suppliers/${supplier.id}/edit`}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {supplier.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${supplier.email}`} className="hover:underline">
                  {supplier.email}
                </a>
              </div>
            )}
            {supplier.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{supplier.phone}</span>
              </div>
            )}
            {supplier.website && (
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <a
                  href={supplier.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {supplier.website}
                </a>
              </div>
            )}
            {!supplier.email && !supplier.phone && !supplier.website && (
              <p className="text-muted-foreground">No contact info</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Address</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {supplier.address ? (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p>{supplier.address}</p>
                  {(supplier.city || supplier.state || supplier.zipCode) && (
                    <p>
                      {supplier.city && `${supplier.city}`}
                      {supplier.state && `, ${supplier.state}`}
                      {supplier.zipCode && ` ${supplier.zipCode}`}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No address</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Order Details</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment Terms</span>
              <span>{supplier.paymentTerms || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Lead Time</span>
              <span>
                {supplier.leadTimeDays
                  ? `${supplier.leadTimeDays} days`
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Linked Items</span>
              <span>{supplier.supplierItems.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {supplier.notes && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{supplier.notes}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Linked Items</CardTitle>
          <LinkItemButton
            supplierId={supplier.id}
            inventoryItems={inventoryItems}
            existingItemIds={existingItemIds}
          />
        </CardHeader>
        <CardContent>
          {supplier.supplierItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No items linked to this supplier yet.
            </p>
          ) : (
            <div className="space-y-3">
              {supplier.supplierItems.map((si) => (
                <div
                  key={si.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/inventory/${si.inventoryItemId}`}
                        className="font-medium hover:underline"
                      >
                        {si.inventoryItem.name}
                      </Link>
                      {si.isPreferred && <Badge>Preferred</Badge>}
                      <Badge
                        variant="outline"
                        style={{
                          borderColor: si.inventoryItem.category?.color ?? undefined,
                          color: si.inventoryItem.category?.color ?? undefined,
                        }}
                      >
                        {si.inventoryItem.category?.name ?? "Uncategorized"}
                      </Badge>
                    </div>
                    <div className="mt-1 flex gap-4 text-sm text-muted-foreground">
                      {si.supplierSku && <span>SKU: {si.supplierSku}</span>}
                      <span>${Number(si.unitCost).toFixed(2)}</span>
                      {si.minOrderQty && (
                        <span>Min: {Number(si.minOrderQty)}</span>
                      )}
                    </div>
                  </div>
                  <UnlinkItemButton
                    supplierItemId={si.id}
                    itemName={si.inventoryItem.name}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {supplier.purchaseOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {supplier.purchaseOrders.map((po) => (
                <div
                  key={po.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{po.orderNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      {po.location.name} &middot;{" "}
                      {new Date(po.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      ${Number(po.totalAmount).toFixed(2)}
                    </p>
                    <Badge variant="outline">{po.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
