"use client";

import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Trash2 } from "lucide-react";
import { deletePurchaseOrder } from "@/actions/orders";
import { toast } from "sonner";
import { useState } from "react";
import ConfirmDialog from "@/components/shared/confirm-dialog";
import OrderStatusBadge from "./order-status-badge";

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: unknown;
  createdAt: Date;
  supplier: { name: string };
  location: { name: string };
  createdBy: { name: string | null; email: string };
  _count: { lines: number };
}

function ActionsCell({ order }: { order: PurchaseOrder }) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function handleDelete() {
    const result = await deletePurchaseOrder(order.id);
    if (result.success) {
      toast.success("Order deleted");
    } else {
      toast.error(result.error);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/orders/${order.id}`}>
              <Eye className="mr-2 h-4 w-4" />
              View
            </Link>
          </DropdownMenuItem>
          {order.status === "DRAFT" && (
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => setConfirmOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete Order"
        description={`Are you sure you want to delete order ${order.orderNumber}?`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        destructive
      />
    </>
  );
}

const columns: ColumnDef<PurchaseOrder>[] = [
  {
    accessorKey: "orderNumber",
    header: "Order #",
    cell: ({ row }) => (
      <Link
        href={`/orders/${row.original.id}`}
        className="font-medium hover:underline"
      >
        {row.getValue("orderNumber")}
      </Link>
    ),
  },
  {
    id: "supplier",
    header: "Supplier",
    accessorFn: (row) => row.supplier.name,
  },
  {
    id: "location",
    header: "Location",
    accessorFn: (row) => row.location.name,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <OrderStatusBadge status={row.getValue("status")} />,
  },
  {
    id: "lines",
    header: "Items",
    cell: ({ row }) => row.original._count.lines,
  },
  {
    id: "total",
    header: "Total",
    cell: ({ row }) => `$${Number(row.original.totalAmount).toFixed(2)}`,
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) =>
      new Date(row.getValue("createdAt")).toLocaleDateString(),
  },
  {
    id: "actions",
    cell: ({ row }) => <ActionsCell order={row.original} />,
  },
];

export default function OrderTable({ orders }: { orders: PurchaseOrder[] }) {
  return (
    <DataTable
      columns={columns}
      data={orders}
      searchKey="orderNumber"
      searchPlaceholder="Search orders..."
    />
  );
}
