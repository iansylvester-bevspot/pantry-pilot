import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  color: z.string().optional(),
  type: z.enum(["SUPER", "CATEGORY", "SUBCATEGORY"]).default("CATEGORY"),
  parentId: z.string().nullable().optional(),
  glCode: z.string().optional(),
});

export const inventoryItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().optional(),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  unit: z.string().default("EACH"),
  packSize: z.coerce.number().int().min(1).optional(),
  packUnit: z.string().optional(),
  unitCost: z.coerce.number().min(0, "Cost must be 0 or more"),
  parLevel: z.coerce.number().min(0, "Par level must be 0 or more"),
  maxLevel: z.coerce.number().min(0).optional(),
  storageTemp: z.string().optional(),
  shelfLifeDays: z.coerce.number().int().min(0).optional(),
  notes: z.string().optional(),
  glCode: z.string().optional(),
  locationId: z.string().min(1, "Location is required"),
  // Wine-specific fields
  vintage: z.coerce.number().int().min(1900).max(2100).optional(),
  binNumber: z.string().optional(),
  varietal: z.string().optional(),
  region: z.string().optional(),
  producer: z.string().optional(),
  abv: z.coerce.number().min(0).max(100).optional(),
  // Beer-specific fields
  brewery: z.string().optional(),
  beerStyle: z.string().optional(),
  ibu: z.coerce.number().int().min(0).max(200).optional(),
});

export const stockAdjustmentSchema = z.object({
  inventoryItemId: z.string().min(1),
  locationId: z.string().min(1),
  quantity: z.coerce.number(),
  reason: z.string().min(1, "Reason is required"),
});

export type CategoryInput = z.infer<typeof categorySchema>;
export type InventoryItemInput = z.infer<typeof inventoryItemSchema>;
export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;
