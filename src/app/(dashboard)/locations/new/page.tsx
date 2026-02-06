import PageHeader from "@/components/shared/page-header";
import LocationForm from "@/components/locations/location-form";

export default function NewLocationPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Add Location"
        description="Create a new location to manage inventory"
      />
      <LocationForm />
    </div>
  );
}
