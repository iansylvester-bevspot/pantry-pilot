"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import StockAdjustmentDialog from "./stock-adjustment-dialog";

interface ItemStockActionsProps {
  itemId: string;
  itemName: string;
  locationId: string;
  currentQuantity: number;
}

export default function ItemStockActions({
  itemId,
  itemName,
  locationId,
  currentQuantity,
}: ItemStockActionsProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Adjust Stock
      </Button>
      <StockAdjustmentDialog
        open={open}
        onOpenChange={setOpen}
        itemId={itemId}
        itemName={itemName}
        locationId={locationId}
        currentQuantity={currentQuantity}
      />
    </>
  );
}
