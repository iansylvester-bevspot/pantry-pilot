"use client";

import { useState, useTransition } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronRight,
  Edit,
  FolderOpen,
  Layers,
  Package,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { deleteCategory, type CategoryTreeNode } from "@/actions/categories";
import { CategoryFormDialog, type ParentOption } from "./category-form-dialog";
import { BulkCreateDialog } from "./bulk-create-dialog";
import ConfirmDialog from "@/components/shared/confirm-dialog";

export function CategoryTreeManager({
  tree,
}: {
  tree: CategoryTreeNode[];
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [formType, setFormType] = useState<"SUPER" | "CATEGORY" | "SUBCATEGORY">("SUPER");
  const [formParentId, setFormParentId] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<CategoryTreeNode | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CategoryTreeNode | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkType, setBulkType] = useState<"SUPER" | "CATEGORY" | "SUBCATEGORY">("SUPER");
  const [bulkParentId, setBulkParentId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Separate assigned (SUPER with children) from unassigned (parentless non-SUPER)
  const superCategories = tree.filter((n) => n.type === "SUPER");
  const unassigned = tree.filter((n) => n.type !== "SUPER");

  // Build flat list of all categories as potential parent options
  const parentOptions: ParentOption[] = [];
  function collectAll(nodes: CategoryTreeNode[]) {
    for (const node of nodes) {
      parentOptions.push({ id: node.id, name: node.name, type: node.type });
      collectAll(node.children);
    }
  }
  collectAll(tree);

  function openCreate(type: "SUPER" | "CATEGORY" | "SUBCATEGORY", parentId: string | null) {
    setEditingCategory(null);
    setFormType(type);
    setFormParentId(parentId);
    setFormOpen(true);
  }

  function openBulk(type: "SUPER" | "CATEGORY" | "SUBCATEGORY", parentId: string | null) {
    setBulkType(type);
    setBulkParentId(parentId);
    setBulkOpen(true);
  }

  function openEdit(node: CategoryTreeNode) {
    setEditingCategory(node);
    setFormType(node.type);
    setFormParentId(node.parentId);
    setFormOpen(true);
  }

  function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteCategory(deleteTarget.id);
      if (result.success) {
        toast.success("Category deleted");
        setDeleteTarget(null);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Organize your categories into a hierarchy: Super Category &gt; Category &gt; Subcategory
        </p>
        <div className="flex gap-2">
          <Button onClick={() => openBulk("SUPER", null)} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-1" />
            Bulk Add
          </Button>
          <Button onClick={() => openCreate("SUPER", null)} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Super Category
          </Button>
        </div>
      </div>

      {superCategories.length === 0 && unassigned.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <Layers className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
          <h3 className="text-lg font-medium mb-1">No categories yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Start by creating a super category like &quot;Food&quot; or &quot;Beverage&quot;
          </p>
          <Button onClick={() => openCreate("SUPER", null)}>
            <Plus className="h-4 w-4 mr-1" />
            Create Super Category
          </Button>
        </div>
      )}

      {/* Super category accordions */}
      {superCategories.length > 0 && (
        <Accordion type="multiple" className="space-y-2">
          {superCategories.map((superCat) => (
            <AccordionItem
              key={superCat.id}
              value={superCat.id}
              className="rounded-lg border bg-card"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: superCat.color || "#6366f1" }}
                  />
                  <span className="font-semibold text-base">{superCat.name}</span>
                  {superCat.glCode && (
                    <Badge variant="outline" className="font-mono text-xs">
                      GL: {superCat.glCode}
                    </Badge>
                  )}
                  <Badge variant="secondary" className="ml-auto mr-2">
                    {superCat._count.children} categor{superCat._count.children === 1 ? "y" : "ies"}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="flex gap-2 mb-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEdit(superCat)}
                  >
                    <Edit className="h-3 w-3 mr-1" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openCreate("CATEGORY", superCat.id)}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add Category
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openBulk("CATEGORY", superCat.id)}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Bulk Add
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive ml-auto"
                    onClick={() => setDeleteTarget(superCat)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>

                {superCat.children.length === 0 ? (
                  <p className="text-sm text-muted-foreground pl-4 py-2">
                    No categories yet. Add one to get started.
                  </p>
                ) : (
                  <Accordion type="multiple" className="space-y-1">
                    {superCat.children.map((cat) => (
                      <AccordionItem
                        key={cat.id}
                        value={cat.id}
                        className="rounded-md border ml-4"
                      >
                        <AccordionTrigger className="px-3 py-2 hover:no-underline text-sm">
                          <div className="flex items-center gap-2 flex-1">
                            <FolderOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="font-medium">{cat.name}</span>
                            {cat.glCode && (
                              <Badge
                                variant="outline"
                                className="font-mono text-xs"
                              >
                                GL: {cat.glCode}
                              </Badge>
                            )}
                            <div className="ml-auto mr-2 flex items-center gap-2">
                              {cat._count.items > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                  <Package className="h-3 w-3 mr-1" />
                                  {cat._count.items}
                                </Badge>
                              )}
                              {cat._count.children > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                  {cat._count.children} sub
                                </Badge>
                              )}
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-3 pb-3">
                          <div className="flex gap-2 mb-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs"
                              onClick={() => openEdit(cat)}
                            >
                              <Edit className="h-3 w-3 mr-1" /> Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs"
                              onClick={() =>
                                openCreate("SUBCATEGORY", cat.id)
                              }
                            >
                              <Plus className="h-3 w-3 mr-1" /> Add Subcategory
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs"
                              onClick={() => openBulk("SUBCATEGORY", cat.id)}
                            >
                              <Plus className="h-3 w-3 mr-1" /> Bulk Add
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs text-destructive ml-auto"
                              onClick={() => setDeleteTarget(cat)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>

                          {cat.children.length > 0 && (
                            <div className="space-y-1 ml-4">
                              {cat.children.map((sub) => (
                                <div
                                  key={sub.id}
                                  className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                                >
                                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                  <span>{sub.name}</span>
                                  {sub.glCode && (
                                    <Badge
                                      variant="outline"
                                      className="font-mono text-xs"
                                    >
                                      GL: {sub.glCode}
                                    </Badge>
                                  )}
                                  {sub._count.items > 0 && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      <Package className="h-3 w-3 mr-1" />
                                      {sub._count.items}
                                    </Badge>
                                  )}
                                  <div className="ml-auto flex gap-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0"
                                      onClick={() => openEdit(sub)}
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0 text-destructive"
                                      onClick={() => setDeleteTarget(sub)}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {cat.children.length === 0 &&
                            cat._count.items === 0 && (
                              <p className="text-xs text-muted-foreground ml-4">
                                No subcategories. Items can be assigned directly
                                to this category.
                              </p>
                            )}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {/* Unassigned categories (legacy or not yet organized) */}
      {unassigned.length > 0 && (
        <div className="rounded-lg border border-dashed p-4">
          <h3 className="text-sm font-medium mb-2 text-muted-foreground">
            Unassigned Categories
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            These categories don&apos;t belong to a super category yet. Edit them to assign a parent.
          </p>
          <div className="space-y-1">
            {unassigned.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
              >
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: cat.color || "#94a3b8" }}
                />
                <span>{cat.name}</span>
                <Badge variant="outline" className="text-xs">
                  {cat.type}
                </Badge>
                {cat._count.items > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    <Package className="h-3 w-3 mr-1" />
                    {cat._count.items}
                  </Badge>
                )}
                <div className="ml-auto flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => openEdit(cat)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-destructive"
                    onClick={() => setDeleteTarget(cat)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form dialog */}
      <CategoryFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        type={formType}
        parentId={formParentId}
        parentOptions={parentOptions}
        initialData={
          editingCategory
            ? {
                id: editingCategory.id,
                name: editingCategory.name,
                description: editingCategory.description ?? "",
                color: editingCategory.color ?? "",
                glCode: editingCategory.glCode ?? "",
                type: editingCategory.type,
                parentId: editingCategory.parentId,
              }
            : undefined
        }
      />

      {/* Bulk create dialog */}
      <BulkCreateDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        type={bulkType}
        parentId={bulkParentId}
        parentOptions={parentOptions}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Delete ${deleteTarget?.name}?`}
        description={
          deleteTarget?._count.children
            ? `This category has ${deleteTarget._count.children} child categories. You must reassign or delete them first.`
            : deleteTarget?._count.items
              ? `This category has ${deleteTarget._count.items} item(s). You must reassign them first.`
              : "This action cannot be undone."
        }
        onConfirm={handleDelete}
      />
    </div>
  );
}
