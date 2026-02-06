import { z } from "zod";

export const purchaseOrderSchema = z.object({
  supplierId: z.string().min(1, "Supplier is required"),
  locationId: z.string().min(1, "Location is required"),
  notes: z.string().optional(),
  expectedDate: z.string().optional(),
  lines: z
    .array(
      z.object({
        inventoryItemId: z.string().min(1, "Item is required"),
        quantityOrdered: z.coerce.number().min(0.01, "Quantity must be greater than 0"),
        unitCost: z.coerce.number().min(0, "Unit cost must be 0 or greater"),
      })
    )
    .min(1, "At least one line item is required"),
});

export const receiveLineSchema = z.object({
  lineId: z.string().min(1),
  quantityReceived: z.coerce.number().min(0, "Quantity must be 0 or greater"),
});

export type PurchaseOrderFormData = z.infer<typeof purchaseOrderSchema>;
export type ReceiveLineData = z.infer<typeof receiveLineSchema>;
