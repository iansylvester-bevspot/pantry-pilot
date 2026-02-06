"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPurchaseOrder } from "@/actions/orders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Supplier {
  id: string;
  name: string;
  supplierItems: {
    inventoryItemId: string;
    unitCost: unknown;
    inventoryItem: { id: string; name: string; unit: string };
  }[];
}

interface Location {
  id: string;
  name: string;
}

interface OrderLine {
  inventoryItemId: string;
  quantityOrdered: string;
  unitCost: string;
}

interface OrderFormProps {
  suppliers: Supplier[];
  locations: Location[];
}

export default function OrderForm({ suppliers, locations }: OrderFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [notes, setNotes] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [lines, setLines] = useState<OrderLine[]>([
    { inventoryItemId: "", quantityOrdered: "", unitCost: "" },
  ]);

  const selectedSupplier = suppliers.find((s) => s.id === supplierId);
  const supplierItems = selectedSupplier?.supplierItems ?? [];

  function addLine() {
    setLines([
      ...lines,
      { inventoryItemId: "", quantityOrdered: "", unitCost: "" },
    ]);
  }

  function removeLine(index: number) {
    setLines(lines.filter((_, i) => i !== index));
  }

  function updateLine(index: number, field: keyof OrderLine, value: string) {
    const updated = [...lines];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-fill unit cost from supplier item pricing
    if (field === "inventoryItemId") {
      const si = supplierItems.find(
        (si) => si.inventoryItemId === value
      );
      if (si) {
        updated[index].unitCost = Number(si.unitCost).toFixed(2);
      }
    }

    setLines(updated);
  }

  const subtotal = lines.reduce((sum, line) => {
    const qty = parseFloat(line.quantityOrdered) || 0;
    const cost = parseFloat(line.unitCost) || 0;
    return sum + qty * cost;
  }, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const result = await createPurchaseOrder({
      supplierId,
      locationId,
      notes: notes || undefined,
      expectedDate: expectedDate || undefined,
      lines: lines
        .filter((l) => l.inventoryItemId)
        .map((l) => ({
          inventoryItemId: l.inventoryItemId,
          quantityOrdered: parseFloat(l.quantityOrdered) || 0,
          unitCost: parseFloat(l.unitCost) || 0,
        })),
    });

    if (result.success) {
      toast.success("Purchase order created");
      router.push(`/orders/${result.data.id}`);
    } else {
      toast.error(result.error);
    }

    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Supplier *</Label>
                <Select value={supplierId} onValueChange={(val) => {
                  setSupplierId(val);
                  setLines([{ inventoryItemId: "", quantityOrdered: "", unitCost: "" }]);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier..." />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Location *</Label>
                <Select value={locationId} onValueChange={setLocationId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location..." />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="expectedDate">Expected Delivery Date</Label>
                <Input
                  id="expectedDate"
                  type="date"
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes..."
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Line Items</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addLine}>
              <Plus className="mr-2 h-4 w-4" />
              Add Line
            </Button>
          </CardHeader>
          <CardContent>
            {!supplierId ? (
              <p className="text-sm text-muted-foreground">
                Select a supplier first to add line items.
              </p>
            ) : supplierItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                This supplier has no linked items. Link items on the supplier
                detail page first.
              </p>
            ) : (
              <div className="space-y-3">
                {lines.map((line, index) => (
                  <div
                    key={index}
                    className="flex items-end gap-3 rounded-lg border p-3"
                  >
                    <div className="flex-1 space-y-2">
                      <Label>Item</Label>
                      <Select
                        value={line.inventoryItemId}
                        onValueChange={(val) =>
                          updateLine(index, "inventoryItemId", val)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select item..." />
                        </SelectTrigger>
                        <SelectContent>
                          {supplierItems.map((si) => (
                            <SelectItem
                              key={si.inventoryItemId}
                              value={si.inventoryItemId}
                            >
                              {si.inventoryItem.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-28 space-y-2">
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={line.quantityOrdered}
                        onChange={(e) =>
                          updateLine(index, "quantityOrdered", e.target.value)
                        }
                        placeholder="0"
                      />
                    </div>
                    <div className="w-28 space-y-2">
                      <Label>Unit Cost</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={line.unitCost}
                        onChange={(e) =>
                          updateLine(index, "unitCost", e.target.value)
                        }
                        placeholder="0.00"
                      />
                    </div>
                    <div className="w-24 text-right">
                      <Label className="invisible">Total</Label>
                      <p className="py-2 text-sm font-medium">
                        $
                        {(
                          (parseFloat(line.quantityOrdered) || 0) *
                          (parseFloat(line.unitCost) || 0)
                        ).toFixed(2)}
                      </p>
                    </div>
                    {lines.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-destructive"
                        onClick={() => removeLine(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}

                <div className="flex justify-end border-t pt-3">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Subtotal</p>
                    <p className="text-lg font-bold">${subtotal.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={loading || !supplierId || !locationId}
          >
            {loading ? "Creating..." : "Create Order (Draft)"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/orders")}
          >
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
}
