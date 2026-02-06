import { Badge } from "@/components/ui/badge";

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  SUBMITTED: { label: "Submitted", variant: "outline" },
  APPROVED: { label: "Approved", variant: "outline" },
  ORDERED: { label: "Ordered", variant: "default" },
  PARTIALLY_RECEIVED: { label: "Partially Received", variant: "outline" },
  RECEIVED: { label: "Received", variant: "default" },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
};

export default function OrderStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? { label: status, variant: "secondary" as const };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
