"use client";

import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";

const REASON_LABELS: Record<string, string> = {
  EXPIRED: "Expired",
  SPOILED: "Spoiled",
  DAMAGED: "Damaged",
  OVERPRODUCTION: "Overproduction",
  CONTAMINATED: "Contaminated",
  PREP_WASTE: "Prep Waste",
  CUSTOMER_RETURN: "Customer Return",
  OTHER: "Other",
};

interface WasteLog {
  id: string;
  quantity: unknown;
  unitCost: unknown;
  totalCost: unknown;
  reason: string;
  notes: string | null;
  wastedAt: Date;
  inventoryItem: {
    id: string;
    name: string;
    unit: string;
    category: { name: string; color: string | null };
  };
  location: { name: string };
  loggedBy: { name: string | null; email: string };
}

const columns: ColumnDef<WasteLog>[] = [
  {
    accessorKey: "wastedAt",
    header: "Date",
    cell: ({ row }) =>
      new Date(row.getValue("wastedAt")).toLocaleDateString(),
  },
  {
    id: "item",
    header: "Item",
    accessorFn: (row) => row.inventoryItem.name,
    cell: ({ row }) => (
      <Link
        href={`/inventory/${row.original.inventoryItem.id}`}
        className="font-medium hover:underline"
      >
        {row.original.inventoryItem.name}
      </Link>
    ),
  },
  {
    id: "category",
    header: "Category",
    cell: ({ row }) => (
      <Badge
        variant="outline"
        style={{
          borderColor: row.original.inventoryItem.category.color ?? undefined,
          color: row.original.inventoryItem.category.color ?? undefined,
        }}
      >
        {row.original.inventoryItem.category.name}
      </Badge>
    ),
  },
  {
    id: "quantity",
    header: "Quantity",
    cell: ({ row }) =>
      `${Number(row.original.quantity)} ${row.original.inventoryItem.unit.toLowerCase()}`,
  },
  {
    accessorKey: "reason",
    header: "Reason",
    cell: ({ row }) => (
      <Badge variant="secondary">
        {REASON_LABELS[row.getValue("reason") as string] ?? row.getValue("reason")}
      </Badge>
    ),
  },
  {
    id: "cost",
    header: "Cost",
    cell: ({ row }) => (
      <span className="text-destructive font-medium">
        ${Number(row.original.totalCost).toFixed(2)}
      </span>
    ),
  },
  {
    id: "location",
    header: "Location",
    accessorFn: (row) => row.location.name,
  },
  {
    id: "loggedBy",
    header: "Logged By",
    cell: ({ row }) =>
      row.original.loggedBy.name ?? row.original.loggedBy.email,
  },
];

export default function WasteTable({ logs }: { logs: WasteLog[] }) {
  return (
    <DataTable
      columns={columns}
      data={logs}
      searchKey="item"
      searchPlaceholder="Search waste logs..."
    />
  );
}
