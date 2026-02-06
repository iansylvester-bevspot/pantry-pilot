import { Badge } from "@/components/ui/badge";

interface StockLevelBadgeProps {
  quantity: number;
  parLevel: number;
}

export default function StockLevelBadge({
  quantity,
  parLevel,
}: StockLevelBadgeProps) {
  if (quantity <= 0) {
    return <Badge variant="destructive">Out of Stock</Badge>;
  }
  if (parLevel > 0 && quantity <= parLevel) {
    return (
      <Badge className="bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30">
        Low Stock
      </Badge>
    );
  }
  return (
    <Badge className="bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30">
      In Stock
    </Badge>
  );
}
