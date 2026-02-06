import { z } from "zod";

export const wasteLogSchema = z.object({
  inventoryItemId: z.string().min(1, "Item is required"),
  locationId: z.string().min(1, "Location is required"),
  quantity: z.coerce.number().min(0.01, "Quantity must be greater than 0"),
  reason: z.enum([
    "EXPIRED",
    "SPOILED",
    "DAMAGED",
    "OVERPRODUCTION",
    "CONTAMINATED",
    "PREP_WASTE",
    "CUSTOMER_RETURN",
    "OTHER",
  ]),
  notes: z.string().optional(),
});

export type WasteLogFormData = z.infer<typeof wasteLogSchema>;
