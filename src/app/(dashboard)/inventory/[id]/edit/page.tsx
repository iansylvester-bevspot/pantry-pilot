import { notFound } from "next/navigation";
import { getInventoryItem } from "@/actions/inventory";
import { getLeafCategories } from "@/actions/categories";
import { getLocations } from "@/actions/locations";
import PageHeader from "@/components/shared/page-header";
import InventoryForm from "@/components/inventory/inventory-form";

export default async function EditInventoryItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [item, categories, locations] = await Promise.all([
    getInventoryItem(id),
    getLeafCategories(),
    getLocations(),
  ]);

  if (!item) notFound();

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title={`Edit: ${item.name}`}
        description="Update inventory item details"
      />
      <InventoryForm
        categories={categories}
        locations={locations}
        item={{
          id: item.id,
          name: item.name,
          sku: item.sku,
          description: item.description,
          categoryId: item.categoryId ?? "",
          unit: item.unit,
          packSize: item.packSize,
          packUnit: item.packUnit,
          unitCost: Number(item.unitCost),
          parLevel: Number(item.parLevel),
          maxLevel: item.maxLevel ? Number(item.maxLevel) : null,
          storageTemp: item.storageTemp,
          shelfLifeDays: item.shelfLifeDays,
          notes: item.notes,
          glCode: item.glCode,
          locationId: item.locationId,
          vintage: item.vintage,
          binNumber: item.binNumber,
          varietal: item.varietal,
          region: item.region,
          producer: item.producer,
          abv: item.abv ? Number(item.abv) : null,
          brewery: item.brewery,
          beerStyle: item.beerStyle,
          ibu: item.ibu,
        }}
      />
    </div>
  );
}
