import Link from "next/link";
import { getInventoryItems } from "@/actions/inventory";
import PageHeader from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import InventoryTable from "@/components/inventory/inventory-table";

export default async function InventoryPage() {
  const items = await getInventoryItems();

  return (
    <div className="space-y-6">
      <PageHeader title="Inventory" description="Manage your inventory items">
        <Button asChild>
          <Link href="/inventory/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Link>
        </Button>
      </PageHeader>
      <InventoryTable items={items} />
    </div>
  );
}
