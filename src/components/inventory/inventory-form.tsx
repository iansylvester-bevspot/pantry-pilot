"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createInventoryItem, updateInventoryItem } from "@/actions/inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const UNIT_OPTIONS = [
  { value: "EACH", label: "Each" },
  { value: "LB", label: "Pound (lb)" },
  { value: "OZ", label: "Ounce (oz)" },
  { value: "KG", label: "Kilogram (kg)" },
  { value: "G", label: "Gram (g)" },
  { value: "GAL", label: "Gallon" },
  { value: "QT", label: "Quart" },
  { value: "PT", label: "Pint" },
  { value: "FL_OZ", label: "Fluid Ounce" },
  { value: "L", label: "Liter" },
  { value: "ML", label: "Milliliter" },
  { value: "CASE", label: "Case" },
  { value: "BOX", label: "Box" },
  { value: "BAG", label: "Bag" },
  { value: "BUNCH", label: "Bunch" },
  { value: "DOZEN", label: "Dozen" },
];

interface Category {
  id: string;
  name: string;
  type: string;
  parent?: { name: string; parent?: { name: string } | null } | null;
}

interface Location {
  id: string;
  name: string;
}

interface InventoryFormProps {
  categories: Category[];
  locations: Location[];
  item?: {
    id: string;
    name: string;
    sku: string | null;
    description: string | null;
    categoryId: string;
    unit: string;
    unitCost: number | { toString(): string };
    parLevel: number | { toString(): string };
    maxLevel: number | { toString(): string } | null;
    storageTemp: string | null;
    shelfLifeDays: number | null;
    notes: string | null;
    glCode: string | null;
    locationId: string;
  };
}

/** Group categories by their super category for the select dropdown */
function groupCategories(categories: Category[]) {
  const groups: Record<string, Category[]> = {};
  const ungrouped: Category[] = [];

  for (const cat of categories) {
    // Find the super category name
    let superName: string | null = null;
    if (cat.parent?.parent) {
      superName = cat.parent.parent.name; // subcategory → category → SUPER
    } else if (cat.parent) {
      superName = cat.parent.name; // category → SUPER
    }

    if (superName) {
      if (!groups[superName]) groups[superName] = [];
      groups[superName].push(cat);
    } else {
      ungrouped.push(cat);
    }
  }

  return { groups, ungrouped };
}

/** Build display name for a category: "Parent > Name" for subcategories */
function categoryLabel(cat: Category): string {
  if (cat.type === "SUBCATEGORY" && cat.parent) {
    return `${cat.parent.name} > ${cat.name}`;
  }
  return cat.name;
}

export default function InventoryForm({
  categories,
  locations,
  item,
}: InventoryFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const isEditing = !!item;

  const { groups, ungrouped } = groupCategories(categories);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setLoading(true);

    const result = isEditing
      ? await updateInventoryItem(item.id, formData)
      : await createInventoryItem(formData);

    if (result.success) {
      toast.success(isEditing ? "Item updated" : "Item created");
      router.push("/inventory");
    } else {
      setError(result.error);
      setLoading(false);
    }
  }

  if (categories.length === 0 || locations.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">
            {categories.length === 0 && "You need to create at least one category before adding inventory items. "}
            {locations.length === 0 && "You need to create at least one location before adding inventory items. "}
            Go to{" "}
            {categories.length === 0 && (
              <a href="/categories" className="text-primary hover:underline">Categories</a>
            )}
            {categories.length === 0 && locations.length === 0 && " and "}
            {locations.length === 0 && (
              <a href="/locations" className="text-primary hover:underline">Locations</a>
            )}
            {" "}to set them up.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Basic Info</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" name="name" defaultValue={item?.name} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sku">SKU</Label>
            <Input id="sku" name="sku" defaultValue={item?.sku ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="categoryId">Category *</Label>
            <Select name="categoryId" defaultValue={item?.categoryId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(groups).map(([superName, cats]) => (
                  <SelectGroup key={superName}>
                    <SelectLabel>{superName}</SelectLabel>
                    {cats.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {categoryLabel(cat)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
                {ungrouped.length > 0 && (
                  <SelectGroup>
                    {Object.keys(groups).length > 0 && (
                      <SelectLabel>Other</SelectLabel>
                    )}
                    {ungrouped.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={item?.description ?? ""}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stock & Pricing</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="unit">Unit *</Label>
            <Select name="unit" defaultValue={item?.unit ?? "EACH"} required>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UNIT_OPTIONS.map((u) => (
                  <SelectItem key={u.value} value={u.value}>
                    {u.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="unitCost">Unit Cost ($) *</Label>
            <Input
              id="unitCost"
              name="unitCost"
              type="number"
              step="0.01"
              min="0"
              defaultValue={item?.unitCost?.toString() ?? "0"}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="parLevel">Par Level *</Label>
            <Input
              id="parLevel"
              name="parLevel"
              type="number"
              step="0.01"
              min="0"
              defaultValue={item?.parLevel?.toString() ?? "0"}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxLevel">Max Level</Label>
            <Input
              id="maxLevel"
              name="maxLevel"
              type="number"
              step="0.01"
              min="0"
              defaultValue={item?.maxLevel?.toString() ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="glCode">GL Code</Label>
            <Input
              id="glCode"
              name="glCode"
              defaultValue={item?.glCode ?? ""}
              placeholder="Override category GL code"
            />
          </div>
          {!isEditing && (
            <div className="space-y-2">
              <Label htmlFor="locationId">Location *</Label>
              <Select name="locationId" defaultValue={locations[0]?.id} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {isEditing && (
            <input type="hidden" name="locationId" value={item.locationId} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Storage</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="storageTemp">Storage Temperature</Label>
            <Select name="storageTemp" defaultValue={item?.storageTemp ?? ""}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Dry">Dry</SelectItem>
                <SelectItem value="Refrigerated">Refrigerated</SelectItem>
                <SelectItem value="Frozen">Frozen</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="shelfLifeDays">Shelf Life (days)</Label>
            <Input
              id="shelfLifeDays"
              name="shelfLifeDays"
              type="number"
              min="0"
              defaultValue={item?.shelfLifeDays?.toString() ?? ""}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              defaultValue={item?.notes ?? ""}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading
            ? isEditing
              ? "Saving..."
              : "Creating..."
            : isEditing
            ? "Save Changes"
            : "Create Item"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
