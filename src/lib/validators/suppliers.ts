import { z } from "zod";

export const supplierSchema = z.object({
  name: z.string().min(1, "Supplier name is required"),
  contactName: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  notes: z.string().optional(),
  paymentTerms: z.string().optional(),
  leadTimeDays: z.union([z.number().int().min(0), z.null()]).optional(),
});

export const supplierItemSchema = z.object({
  supplierId: z.string().min(1, "Supplier is required"),
  inventoryItemId: z.string().min(1, "Inventory item is required"),
  supplierSku: z.string().optional(),
  unitCost: z.coerce.number().min(0, "Unit cost must be 0 or greater"),
  minOrderQty: z.coerce.number().min(0).optional().nullable(),
  isPreferred: z.boolean().default(false),
});

export type SupplierFormData = z.infer<typeof supplierSchema>;
export type SupplierItemFormData = z.infer<typeof supplierItemSchema>;
