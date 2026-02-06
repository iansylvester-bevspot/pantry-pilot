import { getCategoryTree } from "@/actions/categories";
import { CategoryTreeManager } from "@/components/categories/category-tree-manager";
import { Layers } from "lucide-react";

export default async function CategoriesPage() {
  const tree = await getCategoryTree();

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Layers className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Categories</h1>
        </div>
        <p className="text-muted-foreground mt-1">
          Manage your product categories, subcategories, and GL codes
        </p>
      </div>
      <CategoryTreeManager tree={tree} />
    </div>
  );
}
