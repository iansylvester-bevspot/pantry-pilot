"use client";

import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";
import { deleteSupplier } from "@/actions/suppliers";
import { toast } from "sonner";
import { useState } from "react";
import ConfirmDialog from "@/components/shared/confirm-dialog";

interface Supplier {
  id: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  _count: {
    supplierItems: number;
    purchaseOrders: number;
  };
}

function ActionsCell({ supplier }: { supplier: Supplier }) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function handleDelete() {
    const result = await deleteSupplier(supplier.id);
    if (result.success) {
      toast.success("Supplier deleted");
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
            <Link href={`/suppliers/${supplier.id}`}>
              <Eye className="mr-2 h-4 w-4" />
              View
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/suppliers/${supplier.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete Supplier"
        description={`Are you sure you want to delete "${supplier.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        destructive
      />
    </>
  );
}

const columns: ColumnDef<Supplier>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <Link
        href={`/suppliers/${row.original.id}`}
        className="font-medium hover:underline"
      >
        {row.getValue("name")}
      </Link>
    ),
  },
  {
    accessorKey: "contactName",
    header: "Contact",
    cell: ({ row }) => row.getValue("contactName") || "—",
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => row.getValue("email") || "—",
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => row.getValue("phone") || "—",
  },
  {
    id: "items",
    header: "Items",
    cell: ({ row }) => (
      <Badge variant="secondary">{row.original._count.supplierItems}</Badge>
    ),
  },
  {
    id: "orders",
    header: "Orders",
    cell: ({ row }) => (
      <Badge variant="outline">{row.original._count.purchaseOrders}</Badge>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => <ActionsCell supplier={row.original} />,
  },
];

interface SupplierTableProps {
  suppliers: Supplier[];
}

export default function SupplierTable({ suppliers }: SupplierTableProps) {
  return (
    <DataTable
      columns={columns}
      data={suppliers}
      searchKey="name"
      searchPlaceholder="Search suppliers..."
    />
  );
}
