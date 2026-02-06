import Link from "next/link";
import { getSuppliers } from "@/actions/suppliers";
import PageHeader from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Plus, Truck } from "lucide-react";
import EmptyState from "@/components/shared/empty-state";
import SupplierTable from "@/components/suppliers/supplier-table";

export default async function SuppliersPage() {
  const suppliers = await getSuppliers();

  return (
    <div className="space-y-6">
      <PageHeader title="Suppliers" description="Manage your suppliers and vendor relationships">
        <Button asChild>
          <Link href="/suppliers/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Supplier
          </Link>
        </Button>
      </PageHeader>

      {suppliers.length === 0 ? (
        <EmptyState
          icon={<Truck className="h-12 w-12" />}
          title="No suppliers yet"
          description="Add your first supplier to start managing vendor relationships and pricing."
        >
          <Button asChild>
            <Link href="/suppliers/new">Add Supplier</Link>
          </Button>
        </EmptyState>
      ) : (
        <SupplierTable suppliers={suppliers} />
      )}
    </div>
  );
}
