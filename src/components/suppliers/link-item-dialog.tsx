"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { linkSupplierItem } from "@/actions/suppliers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface InventoryItem {
  id: string;
  name: string;
  sku: string | null;
  category: { name: string };
}

interface LinkItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierId: string;
  inventoryItems: InventoryItem[];
  existingItemIds: string[];
}

export default function LinkItemDialog({
  open,
  onOpenChange,
  supplierId,
  inventoryItems,
  existingItemIds,
}: LinkItemDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [supplierSku, setSupplierSku] = useState("");
  const [minOrderQty, setMinOrderQty] = useState("");
  const [isPreferred, setIsPreferred] = useState(false);

  const availableItems = inventoryItems.filter(
    (item) => !existingItemIds.includes(item.id)
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedItemId || !unitCost) return;

    setLoading(true);

    const result = await linkSupplierItem({
      supplierId,
      inventoryItemId: selectedItemId,
      supplierSku: supplierSku || undefined,
      unitCost: parseFloat(unitCost),
      minOrderQty: minOrderQty ? parseFloat(minOrderQty) : null,
      isPreferred,
    });

    if (result.success) {
      toast.success("Item linked to supplier");
      onOpenChange(false);
      setSelectedItemId("");
      setUnitCost("");
      setSupplierSku("");
      setMinOrderQty("");
      setIsPreferred(false);
      router.refresh();
    } else {
      toast.error(result.error);
    }

    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Link Inventory Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Inventory Item *</Label>
            <Select value={selectedItemId} onValueChange={setSelectedItemId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an item..." />
              </SelectTrigger>
              <SelectContent>
                {availableItems.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                    {item.sku ? ` (${item.sku})` : ""} — {item.category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {availableItems.length === 0 && (
              <p className="text-sm text-muted-foreground">
                All inventory items are already linked to this supplier.
              </p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="unitCost">Unit Cost *</Label>
              <Input
                id="unitCost"
                type="number"
                step="0.01"
                min="0"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplierSku">Supplier SKU</Label>
              <Input
                id="supplierSku"
                value={supplierSku}
                onChange={(e) => setSupplierSku(e.target.value)}
                placeholder="Supplier's item code"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="minOrderQty">Min Order Quantity</Label>
            <Input
              id="minOrderQty"
              type="number"
              step="0.01"
              min="0"
              value={minOrderQty}
              onChange={(e) => setMinOrderQty(e.target.value)}
              placeholder="Optional"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isPreferred"
              checked={isPreferred}
              onCheckedChange={(checked) => setIsPreferred(checked === true)}
            />
            <Label htmlFor="isPreferred" className="font-normal">
              Preferred supplier for this item
            </Label>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !selectedItemId || !unitCost}
            >
              {loading ? "Linking..." : "Link Item"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
