"use client";

import { useState, useTransition, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { createCategory, updateCategory } from "@/actions/categories";
import type { CategoryType } from "@/generated/prisma/client";
import { FormTipBubble } from "./form-tip-bubble";

type CategoryFormData = {
  id?: string;
  name: string;
  description: string;
  color: string;
  glCode: string;
  type: CategoryType;
  parentId: string | null;
};

export type ParentOption = {
  id: string;
  name: string;
  type: CategoryType;
};

const TYPE_LABELS: Record<CategoryType, string> = {
  SUPER: "Super Category",
  CATEGORY: "Category",
  SUBCATEGORY: "Subcategory",
};

// Which parent type is required for each category type
const PARENT_TYPE_FOR: Record<CategoryType, CategoryType | null> = {
  SUPER: null,
  CATEGORY: "SUPER",
  SUBCATEGORY: "CATEGORY",
};

export function CategoryFormDialog({
  open,
  onOpenChange,
  initialData,
  parentId,
  type,
  parentOptions,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: CategoryFormData;
  parentId?: string | null;
  type: CategoryType;
  parentOptions: ParentOption[];
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

  // Reset form when dialog opens with new data
  useEffect(() => {
    if (open) {
      setForm(
        initialData ?? {
          name: "",
          description: "",
          color: "",
          glCode: "",
          type,
          parentId: parentId ?? null,
        }
      );
    }
  }, [open, initialData, type, parentId]);

  // Filter parent options based on selected type
  const requiredParentType = PARENT_TYPE_FOR[form.type];
  const filteredParents = requiredParentType
    ? parentOptions.filter((p) => p.type === requiredParentType && p.id !== initialData?.id)
    : [];

  function handleTypeChange(newType: CategoryType) {
    const newRequiredParent = PARENT_TYPE_FOR[newType];
    // Clear parentId if the new type doesn't need a parent, or if current parent is wrong type
    const currentParent = parentOptions.find((p) => p.id === form.parentId);
    const parentStillValid =
      newRequiredParent && currentParent?.type === newRequiredParent;

    setForm({
      ...form,
      type: newType,
      parentId: parentStillValid ? form.parentId : null,
    });
  }

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
            ? `${TYPE_LABELS[form.type]} updated`
            : `${TYPE_LABELS[form.type]} created`
        );
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md overflow-visible">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit" : "New"} {TYPE_LABELS[form.type]}
          </DialogTitle>
        </DialogHeader>

        {!isEditing && <FormTipBubble type={form.type} />}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type selector — shown when editing so user can reclassify */}
          {isEditing && (
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={form.type}
                onValueChange={(v) => handleTypeChange(v as CategoryType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUPER">Super Category</SelectItem>
                  <SelectItem value="CATEGORY">Category</SelectItem>
                  <SelectItem value="SUBCATEGORY">Subcategory</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Parent selector — shown when type requires a parent */}
          {requiredParentType && (
            <div className="space-y-2">
              <Label>
                Parent {TYPE_LABELS[requiredParentType]}
              </Label>
              {filteredParents.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No {TYPE_LABELS[requiredParentType].toLowerCase()}s exist yet.
                  Create one first.
                </p>
              ) : (
                <Select
                  value={form.parentId ?? ""}
                  onValueChange={(v) => setForm({ ...form, parentId: v || null })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Select ${TYPE_LABELS[requiredParentType].toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredParents.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={`e.g., ${form.type === "SUPER" ? "Food" : form.type === "CATEGORY" ? "Produce" : "Leafy Greens"}`}
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
            <Button
              type="submit"
              disabled={isPending || (requiredParentType !== null && !form.parentId)}
            >
              {isPending
                ? "Saving..."
                : isEditing
                  ? "Save Changes"
                  : `Create ${TYPE_LABELS[form.type]}`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
