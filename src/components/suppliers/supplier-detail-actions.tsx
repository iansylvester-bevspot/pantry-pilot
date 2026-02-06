"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import LinkItemDialog from "./link-item-dialog";
import ConfirmDialog from "@/components/shared/confirm-dialog";
import { unlinkSupplierItem } from "@/actions/suppliers";
import { toast } from "sonner";

interface InventoryItem {
  id: string;
  name: string;
  sku: string | null;
  category: { name: string };
}

interface SupplierDetailActionsProps {
  supplierId: string;
  inventoryItems: InventoryItem[];
  existingItemIds: string[];
}

export function LinkItemButton({
  supplierId,
  inventoryItems,
  existingItemIds,
}: SupplierDetailActionsProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Link Item
      </Button>
      <LinkItemDialog
        open={open}
        onOpenChange={setOpen}
        supplierId={supplierId}
        inventoryItems={inventoryItems}
        existingItemIds={existingItemIds}
      />
    </>
  );
}

export function UnlinkItemButton({
  supplierItemId,
  itemName,
}: {
  supplierItemId: string;
  itemName: string;
}) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function handleUnlink() {
    const result = await unlinkSupplierItem(supplierItemId);
    if (result.success) {
      toast.success("Item unlinked");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-destructive"
        onClick={() => setConfirmOpen(true)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Unlink Item"
        description={`Remove "${itemName}" from this supplier?`}
        confirmLabel="Unlink"
        onConfirm={handleUnlink}
        destructive
      />
    </>
  );
}
