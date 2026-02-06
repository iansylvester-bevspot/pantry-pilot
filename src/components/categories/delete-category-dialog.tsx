"use client";

import { useState, useTransition, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { deleteCategory, type CategoryTreeNode } from "@/actions/categories";
import type { ParentOption } from "./category-form-dialog";

export function DeleteCategoryDialog({
  target,
  open,
  onOpenChange,
  parentOptions,
}: {
  target: CategoryTreeNode | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentOptions: ParentOption[];
}) {
  const [isPending, startTransition] = useTransition();
  const [reassignChildrenTo, setReassignChildrenTo] = useState("");
  const [reassignItemsTo, setReassignItemsTo] = useState("");

  useEffect(() => {
    if (open) {
      setReassignChildrenTo("");
      setReassignItemsTo("");
    }
  }, [open]);

  if (!target) return null;

  const hasChildren = target._count.children > 0;
  const hasItems = target._count.items > 0;
  const isSimpleDelete = !hasChildren && !hasItems;

  // Children go to another category of the same type
  const childReassignOptions = parentOptions.filter(
    (p) => p.type === target.type && p.id !== target.id
  );

  // Items go to any leaf category (not SUPER, not the target)
  const itemReassignOptions = parentOptions.filter(
    (p) => p.type !== "SUPER" && p.id !== target.id
  );

  const canSubmit =
    isSimpleDelete ||
    ((!hasChildren || reassignChildrenTo) && (!hasItems || reassignItemsTo));

  function handleDelete(force = false) {
    startTransition(async () => {
      const result = await deleteCategory(target!.id, {
        reassignChildrenTo: reassignChildrenTo || undefined,
        reassignItemsTo: reassignItemsTo || undefined,
        force,
      });
      if (result.success) {
        toast.success(`${target!.name} deleted`);
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  const childLabel =
    target.type === "SUPER"
      ? `categor${target._count.children === 1 ? "y" : "ies"}`
      : `subcategor${target._count.children === 1 ? "y" : "ies"}`;

  const targetTypeLabel =
    target.type === "SUPER" ? "super categories" : "categories";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {target.name}?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div>
              {isSimpleDelete ? (
                <p>This action cannot be undone.</p>
              ) : (
                <div className="flex items-start gap-2 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/30 p-3">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-900/80 dark:text-amber-200/80 space-y-1">
                    {hasChildren && (
                      <p>
                        Has <strong>{target._count.children}</strong>{" "}
                        {childLabel} that must be reassigned.
                      </p>
                    )}
                    {hasItems && (
                      <p>
                        Has <strong>{target._count.items}</strong> item
                        {target._count.items === 1 ? "" : "s"} that must be
                        reassigned.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {hasChildren && (
          <div className="space-y-2">
            <Label>
              Move {target._count.children} {childLabel} to:
            </Label>
            {childReassignOptions.length === 0 ? (
              <p className="text-sm text-destructive">
                No other {targetTypeLabel} available. Create one first.
              </p>
            ) : (
              <Select
                value={reassignChildrenTo}
                onValueChange={setReassignChildrenTo}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select target..." />
                </SelectTrigger>
                <SelectContent>
                  {childReassignOptions.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        {hasItems && (
          <div className="space-y-2">
            <Label>
              Move {target._count.items} item
              {target._count.items === 1 ? "" : "s"} to:
            </Label>
            {itemReassignOptions.length === 0 ? (
              <p className="text-sm text-destructive">
                No other categories available. Create one first.
              </p>
            ) : (
              <Select
                value={reassignItemsTo}
                onValueChange={setReassignItemsTo}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select target..." />
                </SelectTrigger>
                <SelectContent>
                  {itemReassignOptions.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          {!isSimpleDelete && (
            <Button
              variant="ghost"
              className="text-destructive"
              onClick={() => handleDelete(true)}
              disabled={isPending}
            >
              {isPending ? "Deleting..." : "Delete anyway"}
            </Button>
          )}
          <Button
            variant="destructive"
            onClick={() => handleDelete()}
            disabled={isPending || !canSubmit}
          >
            {isPending ? "Deleting..." : isSimpleDelete ? "Delete" : "Reassign & Delete"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
