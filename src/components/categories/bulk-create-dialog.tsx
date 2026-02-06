"use client";

import { useState, useTransition, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { bulkCreateCategories } from "@/actions/categories";
import type { CategoryType } from "@/generated/prisma/client";
import type { ParentOption } from "./category-form-dialog";
import { FormTipBubble } from "./form-tip-bubble";

const TYPE_LABELS: Record<CategoryType, string> = {
  SUPER: "Super Categories",
  CATEGORY: "Categories",
  SUBCATEGORY: "Subcategories",
};

const PARENT_TYPE_FOR: Record<CategoryType, CategoryType | null> = {
  SUPER: null,
  CATEGORY: "SUPER",
  SUBCATEGORY: "CATEGORY",
};

const PARENT_LABEL: Record<CategoryType, string> = {
  SUPER: "",
  CATEGORY: "Super Category",
  SUBCATEGORY: "Category",
};

export function BulkCreateDialog({
  open,
  onOpenChange,
  type,
  parentId,
  parentOptions,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: CategoryType;
  parentId: string | null;
  parentOptions: ParentOption[];
}) {
  const [isPending, startTransition] = useTransition();
  const [text, setText] = useState("");
  const [selectedParentId, setSelectedParentId] = useState<string | null>(
    parentId
  );

  useEffect(() => {
    if (open) {
      setText("");
      setSelectedParentId(parentId);
    }
  }, [open, parentId]);

  const requiredParentType = PARENT_TYPE_FOR[type];
  const filteredParents = requiredParentType
    ? parentOptions.filter((p) => p.type === requiredParentType)
    : [];

  const names = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const uniqueNames = [...new Set(names)];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (uniqueNames.length === 0) return;

    startTransition(async () => {
      const result = await bulkCreateCategories({
        names: uniqueNames,
        type,
        parentId: selectedParentId,
      });

      if (result.success) {
        const { created, skipped } = result.data;
        if (skipped.length > 0) {
          toast.success(
            `Created ${created} — skipped ${skipped.length} duplicate(s): ${skipped.join(", ")}`
          );
        } else {
          toast.success(`Created ${created} ${TYPE_LABELS[type].toLowerCase()}`);
        }
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
          <DialogTitle>Bulk Add {TYPE_LABELS[type]}</DialogTitle>
          <DialogDescription>
            Enter one name per line. Duplicates will be skipped.
          </DialogDescription>
        </DialogHeader>

        <FormTipBubble type={type} />

        <form onSubmit={handleSubmit} className="space-y-4">
          {requiredParentType && (
            <div className="space-y-2">
              <Label>Parent {PARENT_LABEL[type]}</Label>
              {filteredParents.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No {PARENT_LABEL[type].toLowerCase()}s exist yet. Create one
                  first.
                </p>
              ) : (
                <Select
                  value={selectedParentId ?? ""}
                  onValueChange={(v) => setSelectedParentId(v || null)}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={`Select ${PARENT_LABEL[type].toLowerCase()}`}
                    />
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
            <Label htmlFor="bulk-names">
              Names ({uniqueNames.length} item{uniqueNames.length !== 1 ? "s" : ""})
            </Label>
            <Textarea
              id="bulk-names"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
              placeholder={
                type === "SUPER"
                  ? "Food\nBeverage\nSupplies"
                  : type === "CATEGORY"
                    ? "Produce\nDairy\nMeat\nSeafood\nBakery"
                    : "Rum\nVodka\nWhiskey\nTequila\nGin"
              }
            />
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
              disabled={
                isPending ||
                uniqueNames.length === 0 ||
                (requiredParentType !== null && !selectedParentId)
              }
            >
              {isPending
                ? "Creating..."
                : `Create ${uniqueNames.length} ${TYPE_LABELS[type].toLowerCase()}`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
