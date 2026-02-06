"use client";

import { useState } from "react";
import { createCategory, updateCategory, deleteCategory } from "@/actions/categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus, X, Check } from "lucide-react";
import ConfirmDialog from "@/components/shared/confirm-dialog";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  color: string | null;
  description: string | null;
  _count: { items: number };
}

export default function CategoryManager({
  categories,
}: {
  categories: Category[];
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function handleCreate(formData: FormData) {
    const result = await createCategory(formData);
    if (result.success) {
      setAdding(false);
      toast.success("Category created");
    } else {
      toast.error(result.error);
    }
  }

  async function handleUpdate(id: string, formData: FormData) {
    const result = await updateCategory(id, formData);
    if (result.success) {
      setEditing(null);
      toast.success("Category updated");
    } else {
      toast.error(result.error);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    const result = await deleteCategory(deleteId);
    if (result.success) {
      toast.success("Category deleted");
    } else {
      toast.error(result.error);
    }
    setDeleteId(null);
  }

  return (
    <div className="space-y-3">
      {categories.map((cat) => (
        <div
          key={cat.id}
          className="flex items-center gap-3 rounded-lg border p-3"
        >
          {editing === cat.id ? (
            <form
              action={(fd) => handleUpdate(cat.id, fd)}
              className="flex flex-1 items-center gap-2"
            >
              <input type="color" name="color" defaultValue={cat.color ?? "#3b82f6"} className="h-8 w-8 rounded cursor-pointer" />
              <Input name="name" defaultValue={cat.name} className="flex-1" required />
              <Input name="description" defaultValue={cat.description ?? ""} placeholder="Description" className="flex-1" />
              <Button type="submit" size="sm" variant="ghost">
                <Check className="h-4 w-4" />
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(null)}>
                <X className="h-4 w-4" />
              </Button>
            </form>
          ) : (
            <>
              <div
                className="h-4 w-4 rounded-full shrink-0"
                style={{ backgroundColor: cat.color ?? "#3b82f6" }}
              />
              <span className="font-medium flex-1">{cat.name}</span>
              {cat.description && (
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  {cat.description}
                </span>
              )}
              <Badge variant="secondary">{cat._count.items} items</Badge>
              <Button size="sm" variant="ghost" onClick={() => setEditing(cat.id)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setDeleteId(cat.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      ))}

      {adding ? (
        <form action={handleCreate} className="flex items-center gap-2 rounded-lg border p-3">
          <input type="color" name="color" defaultValue="#3b82f6" className="h-8 w-8 rounded cursor-pointer" />
          <Input name="name" placeholder="Category name" className="flex-1" required autoFocus />
          <Input name="description" placeholder="Description (optional)" className="flex-1" />
          <Button type="submit" size="sm" variant="ghost">
            <Check className="h-4 w-4" />
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setAdding(false)}>
            <X className="h-4 w-4" />
          </Button>
        </form>
      ) : (
        <Button variant="outline" className="w-full" onClick={() => setAdding(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete category"
        description="Are you sure? This cannot be undone. Categories with items cannot be deleted."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        destructive
      />
    </div>
  );
}
