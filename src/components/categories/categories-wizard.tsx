"use client";

import {
  Layers,
  FolderTree,
  FolderOpen,
  ChevronRight,
  Check,
} from "lucide-react";
import {
  SetupWizard,
  type WizardStep,
} from "@/components/shared/setup-wizard/setup-wizard";
import type { CategoryTreeNode } from "@/actions/categories";

const STEPS: WizardStep[] = [
  {
    id: "welcome",
    title: "Welcome to Categories",
    description:
      "Categories help you organize your inventory into a clear hierarchy. You'll set up three levels: Super Categories for high-level grouping, Categories for product types, and Subcategories for specifics.",
    hint: 'Click "Next" to get started.',
    icon: <Layers className="h-5 w-5" />,
    canAutoAdvance: true,
  },
  {
    id: "super",
    title: "Create Super Categories",
    description:
      "Super categories are the top level — they separate your inventory into major groups for independent tracking and reporting. Most operations use at least Food and Beverage.",
    hint: 'Click "Add Super Category" or "Bulk Add" below to create your first super categories.',
    icon: <FolderTree className="h-5 w-5" />,
    canAutoAdvance: true,
  },
  {
    id: "categories",
    title: "Add Categories",
    description:
      "Now expand a super category and add categories under it. These represent your main product groupings — the level you'll most often filter and report on.",
    hint: 'Expand a super category, then click "Add Category" or "Bulk Add" to add several at once.',
    icon: <FolderOpen className="h-5 w-5" />,
    canAutoAdvance: true,
  },
  {
    id: "subcategories",
    title: "Add Subcategories (Optional)",
    description:
      "Subcategories add a third level of detail. They're optional — items can be assigned directly to a category if you don't need this granularity.",
    hint: 'Expand a category and click "Add Subcategory" or "Bulk Add" to create them.',
    icon: <ChevronRight className="h-5 w-5" />,
    canAutoAdvance: true,
    optional: true,
  },
  {
    id: "done",
    title: "You're All Set!",
    description:
      "Your category hierarchy is ready to go. When you add inventory items, you'll select from the categories you just created. You can come back anytime to add, edit, or reorganize.",
    hint: 'Click "Finish Setup" to dismiss this guide.',
    icon: <Check className="h-5 w-5" />,
  },
];

export function CategoriesWizard({ tree }: { tree: CategoryTreeNode[] }) {
  const allNodes = flattenTree(tree);
  const superCount = allNodes.filter((n) => n.type === "SUPER").length;
  const categoryCount = allNodes.filter((n) => n.type === "CATEGORY").length;
  const subCount = allNodes.filter((n) => n.type === "SUBCATEGORY").length;

  // Show wizard if no categories exist at all (fresh start) or first time
  const isEmpty = allNodes.length === 0;

  function isStepComplete(stepId: string): boolean {
    switch (stepId) {
      case "welcome":
        return superCount >= 1;
      case "super":
        return superCount >= 1;
      case "categories":
        return categoryCount >= 1;
      case "subcategories":
        return subCount >= 1;
      case "done":
        return false;
      default:
        return false;
    }
  }

  return (
    <SetupWizard
      wizardKey="categories"
      steps={STEPS}
      isStepComplete={isStepComplete}
      forceShow={isEmpty}
    />
  );
}

function flattenTree(nodes: CategoryTreeNode[]): CategoryTreeNode[] {
  const result: CategoryTreeNode[] = [];
  for (const node of nodes) {
    result.push(node);
    result.push(...flattenTree(node.children));
  }
  return result;
}
