import { getLeafCategories } from "@/actions/categories";
import { getLocations } from "@/actions/locations";
import PageHeader from "@/components/shared/page-header";
import InventoryForm from "@/components/inventory/inventory-form";

export default async function NewInventoryItemPage() {
  const [categories, locations] = await Promise.all([
    getLeafCategories(),
    getLocations(),
  ]);

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Add Inventory Item"
        description="Add a new item to your inventory"
      />
      <InventoryForm categories={categories} locations={locations} />
    </div>
  );
}
