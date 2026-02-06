import { getCategories } from "@/actions/categories";
import PageHeader from "@/components/shared/page-header";
import CategoryManager from "@/components/inventory/category-manager";

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        description="Organize your inventory items into categories"
      />
      <CategoryManager categories={categories} />
    </div>
  );
}
