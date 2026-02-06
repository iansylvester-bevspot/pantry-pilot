"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createCategory, updateCategory } from "@/actions/categories";
import type { CategoryType } from "@/generated/prisma/client";

type CategoryFormData = {
  id?: string;
  name: string;
  description: string;
  color: string;
  glCode: string;
  type: CategoryType;
  parentId: string | null;
};

const TYPE_LABELS: Record<CategoryType, string> = {
  SUPER: "Super Category",
  CATEGORY: "Category",
  SUBCATEGORY: "Subcategory",
};

export function CategoryFormDialog({
  open,
  onOpenChange,
  initialData,
  parentId,
  type,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: CategoryFormData;
  parentId?: string | null;
  type: CategoryType;
}) {
  const [isPending, startTransition] = useTransition();
  const isEditing = !!initialData?.id;

  const [form, setForm] = useState<CategoryFormData>(
    initialData ?? {
      name: "",
      description: "",
      color: "",
      glCode: "",
      type,
      parentId: parentId ?? null,
    }
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const formData = new FormData();
      formData.set("name", form.name);
      formData.set("description", form.description);
      formData.set("color", form.color);
      formData.set("glCode", form.glCode);
      formData.set("type", form.type);
      if (form.parentId) formData.set("parentId", form.parentId);

      const result = isEditing
        ? await updateCategory(initialData!.id!, formData)
        : await createCategory(formData);

      if (result.success) {
        toast.success(
          isEditing
            ? `${TYPE_LABELS[type]} updated`
            : `${TYPE_LABELS[type]} created`
        );
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit" : "New"} {TYPE_LABELS[type]}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={`e.g., ${type === "SUPER" ? "Food" : type === "CATEGORY" ? "Produce" : "Leafy Greens"}`}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <div className="flex gap-2">
                <Input
                  id="color"
                  type="color"
                  value={form.color || "#6366f1"}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="h-10 w-14 p-1"
                />
                <Input
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  placeholder="#6366f1"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="glCode">GL Code</Label>
              <Input
                id="glCode"
                value={form.glCode}
                onChange={(e) => setForm({ ...form, glCode: e.target.value })}
                placeholder="e.g., 5100"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? "Saving..."
                : isEditing
                  ? "Save Changes"
                  : `Create ${TYPE_LABELS[type]}`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
