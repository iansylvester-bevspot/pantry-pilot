import Link from "next/link";
import { getLocations } from "@/actions/locations";
import PageHeader from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, MapPin } from "lucide-react";
import EmptyState from "@/components/shared/empty-state";

export default async function LocationsPage() {
  const locations = await getLocations();

  return (
    <div className="space-y-6">
      <PageHeader title="Locations" description="Manage your restaurant locations">
        <Button asChild>
          <Link href="/locations/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Location
          </Link>
        </Button>
      </PageHeader>

      {locations.length === 0 ? (
        <EmptyState
          icon={<MapPin className="h-12 w-12" />}
          title="No locations yet"
          description="Create your first location to start managing inventory."
        >
          <Button asChild>
            <Link href="/locations/new">Add Location</Link>
          </Button>
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {locations.map((loc) => (
            <Card key={loc.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{loc.name}</h3>
                    {loc.address && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {loc.address}
                        {loc.city && `, ${loc.city}`}
                        {loc.state && `, ${loc.state}`}
                        {loc.zipCode && ` ${loc.zipCode}`}
                      </p>
                    )}
                    {loc.phone && (
                      <p className="text-sm text-muted-foreground">{loc.phone}</p>
                    )}
                  </div>
                  <Badge variant="outline" className="text-green-600">Active</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
