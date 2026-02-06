"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createWasteLog } from "@/actions/waste";
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
import { toast } from "sonner";

const WASTE_REASONS = [
  { value: "EXPIRED", label: "Expired" },
  { value: "SPOILED", label: "Spoiled" },
  { value: "DAMAGED", label: "Damaged" },
  { value: "OVERPRODUCTION", label: "Overproduction" },
  { value: "CONTAMINATED", label: "Contaminated" },
  { value: "PREP_WASTE", label: "Prep Waste" },
  { value: "CUSTOMER_RETURN", label: "Customer Return" },
  { value: "OTHER", label: "Other" },
];

interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  unitCost: unknown;
}

interface Location {
  id: string;
  name: string;
}

interface WasteFormProps {
  items: InventoryItem[];
  locations: Location[];
}

export default function WasteForm({ items, locations }: WasteFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [itemId, setItemId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  const selectedItem = items.find((i) => i.id === itemId);
  const estimatedCost = selectedItem
    ? (parseFloat(quantity) || 0) * Number(selectedItem.unitCost)
    : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const result = await createWasteLog({
      inventoryItemId: itemId,
      locationId,
      quantity: parseFloat(quantity),
      reason,
      notes: notes || undefined,
    });

    if (result.success) {
      toast.success("Waste logged and stock deducted");
      router.push("/waste");
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
            <CardTitle>Waste Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Inventory Item *</Label>
                <Select value={itemId} onValueChange={setItemId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select item..." />
                  </SelectTrigger>
                  <SelectContent>
                    {items.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
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
                    {locations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="quantity">
                  Quantity *{" "}
                  {selectedItem && (
                    <span className="text-muted-foreground font-normal">
                      ({selectedItem.unit.toLowerCase()})
                    </span>
                  )}
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Reason *</Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select reason..." />
                  </SelectTrigger>
                  <SelectContent>
                    {WASTE_REASONS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {estimatedCost > 0 && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                <p className="text-sm text-destructive">
                  Estimated waste cost:{" "}
                  <span className="font-bold">${estimatedCost.toFixed(2)}</span>
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional details about this waste..."
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={loading || !itemId || !locationId || !quantity || !reason}
          >
            {loading ? "Logging..." : "Log Waste"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/waste")}
          >
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
}
