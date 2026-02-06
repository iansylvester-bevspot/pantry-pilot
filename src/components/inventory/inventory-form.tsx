"use client";

import { useState, useEffect } from "react";
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
import { Plus, X } from "lucide-react";

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
  parentId?: string | null;
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
    packSize: number | null;
    packUnit: string | null;
    unitCost: number | { toString(): string };
    parLevel: number | { toString(): string };
    maxLevel: number | { toString(): string } | null;
    storageTemp: string | null;
    shelfLifeDays: number | null;
    notes: string | null;
    glCode: string | null;
    locationId: string;
    vintage: number | null;
    binNumber: string | null;
    varietal: string | null;
    region: string | null;
    producer: string | null;
    abv: number | null;
    brewery: string | null;
    beerStyle: string | null;
    ibu: number | null;
  };
}

// Optional fields that can be toggled
const OPTIONAL_FIELDS = [
  { key: "sku", label: "SKU" },
  { key: "categoryId", label: "Category" },
  { key: "subcategoryId", label: "Subcategory" },
  { key: "description", label: "Description" },
  { key: "parLevel", label: "Par Level" },
  { key: "maxLevel", label: "Max Level" },
  { key: "glCode", label: "GL Code" },
  { key: "storageTemp", label: "Storage Temp" },
  { key: "shelfLifeDays", label: "Shelf Life" },
  { key: "notes", label: "Notes" },
  { key: "wineDetails", label: "Wine Details" },
  { key: "beerDetails", label: "Beer Details" },
] as const;

type OptionalFieldKey = (typeof OPTIONAL_FIELDS)[number]["key"];

const STORAGE_KEY = "inventory_form_fields";
const DEFAULT_FIELDS: OptionalFieldKey[] = [
  "sku",
  "categoryId",
  "subcategoryId",
  "parLevel",
  "glCode",
];

/** Group categories by their super category for the select dropdown */
function groupCategories(categories: Category[]) {
  const groups: Record<string, Category[]> = {};
  const ungrouped: Category[] = [];

  for (const cat of categories) {
    let superName: string | null = null;
    if (cat.parent?.parent) {
      superName = cat.parent.parent.name;
    } else if (cat.parent) {
      superName = cat.parent.name;
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

/** Determine which optional fields have data when editing */
function fieldsWithData(
  item: InventoryFormProps["item"],
  categories: Category[]
): Set<OptionalFieldKey> {
  if (!item) return new Set();
  const fields = new Set<OptionalFieldKey>();
  if (item.sku) fields.add("sku");
  if (item.categoryId) {
    const cat = categories.find((c) => c.id === item.categoryId);
    if (cat?.type === "SUBCATEGORY") {
      fields.add("categoryId");
      fields.add("subcategoryId");
    } else {
      fields.add("categoryId");
    }
  }
  if (item.description) fields.add("description");
  if (Number(item.parLevel) > 0) fields.add("parLevel");
  if (item.maxLevel != null) fields.add("maxLevel");
  if (item.glCode) fields.add("glCode");
  if (item.storageTemp) fields.add("storageTemp");
  if (item.shelfLifeDays != null) fields.add("shelfLifeDays");
  if (item.notes) fields.add("notes");
  if (
    item.vintage ||
    item.binNumber ||
    item.varietal ||
    item.region ||
    item.producer ||
    item.abv
  ) {
    fields.add("wineDetails");
  }
  if (item.brewery || item.beerStyle || item.ibu) {
    fields.add("beerDetails");
  }
  return fields;
}

export default function InventoryForm({
  categories,
  locations,
  item,
}: InventoryFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visibleFields, setVisibleFields] = useState<Set<OptionalFieldKey>>(
    new Set()
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedSubcategoryId, setSelectedSubcategoryId] =
    useState<string>("");
  const router = useRouter();
  const isEditing = !!item;

  // Split categories into CATEGORY and SUBCATEGORY types
  const categoryItems = categories.filter((c) => c.type === "CATEGORY");
  const subcategoryItems = categories.filter((c) => c.type === "SUBCATEGORY");

  // Subcategories available for the currently selected category
  const availableSubcategories = selectedCategoryId
    ? subcategoryItems.filter((s) => s.parentId === selectedCategoryId)
    : [];

  // Initialize visible fields from localStorage (or defaults) + any fields with data
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const saved: OptionalFieldKey[] = stored
      ? JSON.parse(stored)
      : DEFAULT_FIELDS;
    const withData = fieldsWithData(item, categories);
    setVisibleFields(new Set([...saved, ...withData]));

    // Set initial category/subcategory selection when editing
    if (item?.categoryId) {
      const cat = categories.find((c) => c.id === item.categoryId);
      if (cat?.type === "SUBCATEGORY" && cat.parentId) {
        setSelectedCategoryId(cat.parentId);
        setSelectedSubcategoryId(item.categoryId);
      } else {
        setSelectedCategoryId(item.categoryId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  // Persist field preferences
  function savePreferences(fields: Set<OptionalFieldKey>) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...fields]));
  }

  function showField(key: OptionalFieldKey) {
    const next = new Set(visibleFields);
    next.add(key);
    setVisibleFields(next);
    savePreferences(next);
  }

  function hideField(key: OptionalFieldKey) {
    const next = new Set(visibleFields);
    next.delete(key);
    setVisibleFields(next);
    savePreferences(next);
  }

  const isVisible = (key: OptionalFieldKey) => visibleFields.has(key);

  const hiddenFields = OPTIONAL_FIELDS.filter((f) => !isVisible(f.key));

  // Group categories for the dropdown
  const { groups: categoryGroups, ungrouped: ungroupedCategories } =
    groupCategories(categoryItems);

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

  if (locations.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">
            You need to create at least one location before adding inventory
            items. Go to{" "}
            <a href="/locations" className="text-primary hover:underline">
              Locations
            </a>{" "}
            to set one up.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {error && <p className="text-sm text-destructive">{error}</p>}

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
            <Label>Case / Pack Size</Label>
            <div className="flex gap-2">
              <Input
                id="packSize"
                name="packSize"
                type="number"
                min="1"
                className="w-20"
                defaultValue={item?.packSize?.toString() ?? ""}
                placeholder="Qty"
              />
              <span className="flex items-center text-sm text-muted-foreground">&times;</span>
              <Input
                id="packUnit"
                name="packUnit"
                className="flex-1"
                defaultValue={item?.packUnit ?? ""}
                placeholder="e.g., 5lb bags, 750ml bottles"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              e.g., 8 &times; 5lb bags, 12 &times; 750ml bottles
            </p>
          </div>

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

          {!isEditing && (
            <div className="space-y-2">
              <Label htmlFor="locationId">Location *</Label>
              <Select
                name="locationId"
                defaultValue={locations[0]?.id}
                required
              >
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

          {isVisible("sku") && (
            <FieldWrapper label="SKU" fieldKey="sku" onHide={hideField}>
              <Input
                id="sku"
                name="sku"
                defaultValue={item?.sku ?? ""}
              />
            </FieldWrapper>
          )}

          {isVisible("categoryId") && (
            <FieldWrapper
              label="Category"
              fieldKey="categoryId"
              onHide={(key) => {
                hideField(key);
                hideField("subcategoryId");
                setSelectedCategoryId("");
                setSelectedSubcategoryId("");
              }}
            >
              <Select
                value={selectedCategoryId}
                onValueChange={(v) => {
                  setSelectedCategoryId(v);
                  setSelectedSubcategoryId("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryGroups).map(
                    ([superName, cats]) => (
                      <SelectGroup key={superName}>
                        <SelectLabel>{superName}</SelectLabel>
                        {cats.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )
                  )}
                  {ungroupedCategories.length > 0 && (
                    <SelectGroup>
                      {Object.keys(categoryGroups).length > 0 && (
                        <SelectLabel>Other</SelectLabel>
                      )}
                      {ungroupedCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  )}
                </SelectContent>
              </Select>
            </FieldWrapper>
          )}

          {isVisible("subcategoryId") &&
            isVisible("categoryId") &&
            availableSubcategories.length > 0 && (
              <FieldWrapper
                label="Subcategory"
                fieldKey="subcategoryId"
                onHide={(key) => {
                  hideField(key);
                  setSelectedSubcategoryId("");
                }}
              >
                <Select
                  value={selectedSubcategoryId}
                  onValueChange={setSelectedSubcategoryId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subcategory (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSubcategories.map((sub) => (
                      <SelectItem key={sub.id} value={sub.id}>
                        {sub.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldWrapper>
            )}

          {/* Hidden input submits the most specific category selection */}
          {(selectedSubcategoryId || selectedCategoryId) && (
            <input
              type="hidden"
              name="categoryId"
              value={selectedSubcategoryId || selectedCategoryId}
            />
          )}

          {isVisible("description") && (
            <FieldWrapper
              label="Description"
              fieldKey="description"
              onHide={hideField}
              className="sm:col-span-2"
            >
              <Textarea
                id="description"
                name="description"
                defaultValue={item?.description ?? ""}
                rows={3}
              />
            </FieldWrapper>
          )}
        </CardContent>
      </Card>

      {/* Stock & storage fields — only show card if any are visible */}
      {(isVisible("parLevel") ||
        isVisible("maxLevel") ||
        isVisible("glCode") ||
        isVisible("storageTemp") ||
        isVisible("shelfLifeDays") ||
        isVisible("notes")) && (
        <Card>
          <CardHeader>
            <CardTitle>Stock & Storage</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {isVisible("parLevel") && (
              <FieldWrapper
                label="Par Level"
                fieldKey="parLevel"
                onHide={hideField}
              >
                <Input
                  id="parLevel"
                  name="parLevel"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={item?.parLevel?.toString() ?? "0"}
                />
              </FieldWrapper>
            )}

            {isVisible("maxLevel") && (
              <FieldWrapper
                label="Max Level"
                fieldKey="maxLevel"
                onHide={hideField}
              >
                <Input
                  id="maxLevel"
                  name="maxLevel"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={item?.maxLevel?.toString() ?? ""}
                />
              </FieldWrapper>
            )}

            {isVisible("glCode") && (
              <FieldWrapper
                label="GL Code"
                fieldKey="glCode"
                onHide={hideField}
              >
                <Input
                  id="glCode"
                  name="glCode"
                  defaultValue={item?.glCode ?? ""}
                  placeholder="Override category GL code"
                />
              </FieldWrapper>
            )}

            {isVisible("storageTemp") && (
              <FieldWrapper
                label="Storage Temperature"
                fieldKey="storageTemp"
                onHide={hideField}
              >
                <Select
                  name="storageTemp"
                  defaultValue={item?.storageTemp ?? ""}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Dry">Dry</SelectItem>
                    <SelectItem value="Refrigerated">Refrigerated</SelectItem>
                    <SelectItem value="Frozen">Frozen</SelectItem>
                  </SelectContent>
                </Select>
              </FieldWrapper>
            )}

            {isVisible("shelfLifeDays") && (
              <FieldWrapper
                label="Shelf Life (days)"
                fieldKey="shelfLifeDays"
                onHide={hideField}
              >
                <Input
                  id="shelfLifeDays"
                  name="shelfLifeDays"
                  type="number"
                  min="0"
                  defaultValue={item?.shelfLifeDays?.toString() ?? ""}
                />
              </FieldWrapper>
            )}

            {isVisible("notes") && (
              <FieldWrapper
                label="Notes"
                fieldKey="notes"
                onHide={hideField}
                className="sm:col-span-2"
              >
                <Textarea
                  id="notes"
                  name="notes"
                  defaultValue={item?.notes ?? ""}
                  rows={2}
                />
              </FieldWrapper>
            )}
          </CardContent>
        </Card>
      )}

      {/* Wine details — toggleable section */}
      {isVisible("wineDetails") && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Wine Details</CardTitle>
            <button
              type="button"
              onClick={() => hideField("wineDetails")}
              className="text-muted-foreground hover:text-foreground p-0.5 rounded-sm"
              title="Remove Wine Details"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="producer">Producer / Winery</Label>
              <Input
                id="producer"
                name="producer"
                defaultValue={item?.producer ?? ""}
                placeholder="e.g., Château Margaux"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="varietal">Varietal / Grape</Label>
              <Input
                id="varietal"
                name="varietal"
                defaultValue={item?.varietal ?? ""}
                placeholder="e.g., Cabernet Sauvignon"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vintage">Vintage</Label>
              <Input
                id="vintage"
                name="vintage"
                type="number"
                min="1900"
                max="2100"
                defaultValue={item?.vintage?.toString() ?? ""}
                placeholder="e.g., 2019"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="region">Region / Appellation</Label>
              <Input
                id="region"
                name="region"
                defaultValue={item?.region ?? ""}
                placeholder="e.g., Napa Valley"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="binNumber">Bin Number</Label>
              <Input
                id="binNumber"
                name="binNumber"
                defaultValue={item?.binNumber ?? ""}
                placeholder="e.g., B-42"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="abv">ABV (%)</Label>
              <Input
                id="abv"
                name="abv"
                type="number"
                step="0.1"
                min="0"
                max="100"
                defaultValue={item?.abv?.toString() ?? ""}
                placeholder="e.g., 13.5"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Beer details — toggleable section */}
      {isVisible("beerDetails") && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Beer Details</CardTitle>
            <button
              type="button"
              onClick={() => hideField("beerDetails")}
              className="text-muted-foreground hover:text-foreground p-0.5 rounded-sm"
              title="Remove Beer Details"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="brewery">Brewery</Label>
              <Input
                id="brewery"
                name="brewery"
                defaultValue={item?.brewery ?? ""}
                placeholder="e.g., Sierra Nevada"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="beerStyle">Style</Label>
              <Input
                id="beerStyle"
                name="beerStyle"
                defaultValue={item?.beerStyle ?? ""}
                placeholder="e.g., IPA, Stout, Lager"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ibu">IBU</Label>
              <Input
                id="ibu"
                name="ibu"
                type="number"
                min="0"
                max="200"
                defaultValue={item?.ibu?.toString() ?? ""}
                placeholder="e.g., 65"
              />
            </div>

            {!isVisible("wineDetails") && (
              <div className="space-y-2">
                <Label htmlFor="abv">ABV (%)</Label>
                <Input
                  id="abv"
                  name="abv"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  defaultValue={item?.abv?.toString() ?? ""}
                  placeholder="e.g., 6.8"
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add field chips */}
      {hiddenFields.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Add fields:</span>
          {hiddenFields.map((f) => (
            <Button
              key={f.key}
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => showField(f.key)}
            >
              <Plus className="h-3 w-3 mr-1" />
              {f.label}
            </Button>
          ))}
        </div>
      )}

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
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

/** Wrapper for optional fields with a remove button */
function FieldWrapper({
  label,
  fieldKey,
  onHide,
  className,
  children,
}: {
  label: string;
  fieldKey: OptionalFieldKey;
  onHide: (key: OptionalFieldKey) => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <div className="flex items-center justify-between">
        <Label htmlFor={fieldKey}>{label}</Label>
        <button
          type="button"
          onClick={() => onHide(fieldKey)}
          className="text-muted-foreground hover:text-foreground p-0.5 rounded-sm"
          title={`Remove ${label}`}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      {children}
    </div>
  );
}
