"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  updatePurchaseOrderStatus,
  receivePurchaseOrderLines,
} from "@/actions/orders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ConfirmDialog from "@/components/shared/confirm-dialog";
import { toast } from "sonner";
import type { PurchaseOrderStatus } from "@/generated/prisma/client";

interface OrderLine {
  id: string;
  inventoryItemId: string;
  quantityOrdered: unknown;
  quantityReceived: unknown;
  unitCost: unknown;
  inventoryItem: { name: string; unit: string };
}

interface OrderActionsProps {
  orderId: string;
  status: string;
  lines: OrderLine[];
}

export default function OrderActions({
  orderId,
  status,
  lines,
}: OrderActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<PurchaseOrderStatus | null>(null);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [receiveQtys, setReceiveQtys] = useState<Record<string, string>>({});

  async function handleStatusChange(newStatus: PurchaseOrderStatus) {
    setLoading(true);
    const result = await updatePurchaseOrderStatus(orderId, newStatus);
    if (result.success) {
      toast.success(`Order status updated to ${newStatus.replace(/_/g, " ").toLowerCase()}`);
      router.refresh();
    } else {
      toast.error(result.error);
    }
    setLoading(false);
    setConfirmOpen(false);
    setPendingStatus(null);
  }

  function confirmStatusChange(newStatus: PurchaseOrderStatus) {
    setPendingStatus(newStatus);
    setConfirmOpen(true);
  }

  async function handleReceive(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const receivedLines = Object.entries(receiveQtys)
      .filter(([, qty]) => parseFloat(qty) > 0)
      .map(([lineId, qty]) => ({
        lineId,
        quantityReceived: parseFloat(qty),
      }));

    if (receivedLines.length === 0) {
      toast.error("Enter quantities to receive");
      setLoading(false);
      return;
    }

    const result = await receivePurchaseOrderLines(orderId, receivedLines);
    if (result.success) {
      toast.success("Items received and stock updated");
      setReceiveOpen(false);
      setReceiveQtys({});
      router.refresh();
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  }

  function openReceiveDialog() {
    const initial: Record<string, string> = {};
    for (const line of lines) {
      const remaining =
        Number(line.quantityOrdered) - Number(line.quantityReceived);
      initial[line.id] = remaining > 0 ? remaining.toString() : "0";
    }
    setReceiveQtys(initial);
    setReceiveOpen(true);
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {status === "DRAFT" && (
          <Button
            onClick={() => confirmStatusChange("SUBMITTED")}
            disabled={loading}
          >
            Submit for Approval
          </Button>
        )}
        {status === "SUBMITTED" && (
          <Button
            onClick={() => confirmStatusChange("APPROVED")}
            disabled={loading}
          >
            Approve
          </Button>
        )}
        {status === "APPROVED" && (
          <Button
            onClick={() => confirmStatusChange("ORDERED")}
            disabled={loading}
          >
            Mark as Ordered
          </Button>
        )}
        {(status === "ORDERED" || status === "PARTIALLY_RECEIVED") && (
          <Button onClick={openReceiveDialog} disabled={loading}>
            Receive Items
          </Button>
        )}
        {!["RECEIVED", "CANCELLED"].includes(status) && (
          <Button
            variant="outline"
            className="text-destructive"
            onClick={() => confirmStatusChange("CANCELLED")}
            disabled={loading}
          >
            Cancel Order
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Update Order Status"
        description={`Change status to "${pendingStatus?.replace(/_/g, " ").toLowerCase()}"?`}
        confirmLabel="Confirm"
        onConfirm={() => pendingStatus && handleStatusChange(pendingStatus)}
        destructive={pendingStatus === "CANCELLED"}
      />

      <Dialog open={receiveOpen} onOpenChange={setReceiveOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Receive Items</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleReceive} className="space-y-4">
            {lines.map((line) => {
              const ordered = Number(line.quantityOrdered);
              const received = Number(line.quantityReceived);
              const remaining = ordered - received;

              return (
                <div
                  key={line.id}
                  className="flex items-center gap-4 rounded-lg border p-3"
                >
                  <div className="flex-1">
                    <p className="font-medium">{line.inventoryItem.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Ordered: {ordered} | Received: {received} | Remaining:{" "}
                      {remaining}
                    </p>
                  </div>
                  <div className="w-28 space-y-1">
                    <Label className="text-xs">Qty to Receive</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max={remaining}
                      value={receiveQtys[line.id] ?? "0"}
                      onChange={(e) =>
                        setReceiveQtys({
                          ...receiveQtys,
                          [line.id]: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              );
            })}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setReceiveOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Receiving..." : "Receive Items"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
