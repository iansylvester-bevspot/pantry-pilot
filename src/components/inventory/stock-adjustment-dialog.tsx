"use client";

import { useState } from "react";
import { adjustStock } from "@/actions/inventory";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface StockAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string;
  itemName: string;
  locationId: string;
  currentQuantity: number;
}

export default function StockAdjustmentDialog({
  open,
  onOpenChange,
  itemId,
  itemName,
  locationId,
  currentQuantity,
}: StockAdjustmentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<"add" | "remove">("add");

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    const rawQty = Number(formData.get("quantity"));
    const quantity = adjustmentType === "remove" ? -rawQty : rawQty;

    const fd = new FormData();
    fd.set("inventoryItemId", itemId);
    fd.set("locationId", locationId);
    fd.set("quantity", String(quantity));
    fd.set("reason", formData.get("reason") as string);

    const result = await adjustStock(fd);
    if (result.success) {
      toast.success("Stock adjusted");
      onOpenChange(false);
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust Stock</DialogTitle>
          <DialogDescription>
            {itemName} — Current stock: {currentQuantity}
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={adjustmentType === "add" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setAdjustmentType("add")}
            >
              Add Stock
            </Button>
            <Button
              type="button"
              variant={adjustmentType === "remove" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setAdjustmentType("remove")}
            >
              Remove Stock
            </Button>
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              min="0.01"
              step="0.01"
              required
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Select name="reason" required>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Received delivery">Received delivery</SelectItem>
                <SelectItem value="Physical count correction">Physical count correction</SelectItem>
                <SelectItem value="Returned to supplier">Returned to supplier</SelectItem>
                <SelectItem value="Used in production">Used in production</SelectItem>
                <SelectItem value="Transferred">Transferred</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adjusting..." : "Confirm"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
