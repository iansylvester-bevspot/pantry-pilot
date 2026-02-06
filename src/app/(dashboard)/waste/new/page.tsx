import { getInventoryItems } from "@/actions/inventory";
import { getLocations } from "@/actions/locations";
import PageHeader from "@/components/shared/page-header";
import WasteForm from "@/components/waste/waste-form";

export default async function NewWasteLogPage() {
  const [items, locations] = await Promise.all([
    getInventoryItems(),
    getLocations(),
  ]);

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Log Waste"
        description="Record waste and automatically deduct from stock"
      />
      <WasteForm
        items={items.map((i) => ({
          id: i.id,
          name: i.name,
          unit: i.unit,
          unitCost: i.unitCost,
        }))}
        locations={locations}
      />
    </div>
  );
}
