"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import StockLevelBadge from "./stock-level-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, ArrowUpDown } from "lucide-react";
import Link from "next/link";
import { deleteInventoryItem } from "@/actions/inventory";
import { toast } from "sonner";
import { useState } from "react";
import StockAdjustmentDialog from "./stock-adjustment-dialog";
import ConfirmDialog from "@/components/shared/confirm-dialog";
import EmptyState from "@/components/shared/empty-state";

interface InventoryItem {
  id: string;
  name: string;
  sku: string | null;
  unit: string;
  unitCost: { toString(): string } | number;
  parLevel: { toString(): string } | number;
  locationId: string;
  category: { id: string; name: string; color: string | null };
  stockLevels: { quantity: { toString(): string } | number; locationId: string }[];
}

export default function InventoryTable({ items }: { items: InventoryItem[] }) {
  const [adjustItem, setAdjustItem] = useState<{
    id: string;
    name: string;
    locationId: string;
    quantity: number;
  } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function handleDelete() {
    if (!deleteId) return;
    const result = await deleteInventoryItem(deleteId);
    if (result.success) {
      toast.success("Item deleted");
    } else {
      toast.error(result.error);
    }
    setDeleteId(null);
  }

  const columns: ColumnDef<InventoryItem>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <Link
          href={`/inventory/${row.original.id}`}
          className="font-medium hover:underline"
        >
          {row.original.name}
        </Link>
      ),
    },
    {
      accessorKey: "category.name",
      header: "Category",
      cell: ({ row }) => (
        <Badge
          variant="outline"
          style={{
            borderColor: row.original.category.color ?? undefined,
            color: row.original.category.color ?? undefined,
          }}
        >
          {row.original.category.name}
        </Badge>
      ),
    },
    {
      id: "stock",
      header: "Stock",
      cell: ({ row }) => {
        const stock = row.original.stockLevels[0];
        const qty = stock ? Number(stock.quantity) : 0;
        return <span>{qty} {row.original.unit.toLowerCase()}</span>;
      },
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const stock = row.original.stockLevels[0];
        const qty = stock ? Number(stock.quantity) : 0;
        return (
          <StockLevelBadge
            quantity={qty}
            parLevel={Number(row.original.parLevel)}
          />
        );
      },
    },
    {
      accessorKey: "unitCost",
      header: "Unit Cost",
      cell: ({ row }) => `$${Number(row.original.unitCost).toFixed(2)}`,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const item = row.original;
        const stock = item.stockLevels[0];
        const qty = stock ? Number(stock.quantity) : 0;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() =>
                  setAdjustItem({
                    id: item.id,
                    name: item.name,
                    locationId: item.locationId,
                    quantity: qty,
                  })
                }
              >
                Adjust Stock
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/inventory/${item.id}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => setDeleteId(item.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (items.length === 0) {
    return (
      <EmptyState
        title="No inventory items"
        description="Get started by adding your first inventory item."
      >
        <Button asChild>
          <Link href="/inventory/new">Add Item</Link>
        </Button>
      </EmptyState>
    );
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={items}
        searchKey="name"
        searchPlaceholder="Search items..."
      />

      {adjustItem && (
        <StockAdjustmentDialog
          open={!!adjustItem}
          onOpenChange={(open) => !open && setAdjustItem(null)}
          itemId={adjustItem.id}
          itemName={adjustItem.name}
          locationId={adjustItem.locationId}
          currentQuantity={adjustItem.quantity}
        />
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete item"
        description="Are you sure? This will permanently delete this inventory item and all its stock records."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        destructive
      />
    </>
  );
}
