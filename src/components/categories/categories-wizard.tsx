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
    tips: [
      "Think about how you want to see your reports before you start. Your category structure directly shapes how costs, waste, and inventory value are broken down in reporting.",
      "If your accounting system uses specific GL codes for food vs. beverage, your super categories should mirror those groupings so costs roll up correctly.",
      "You can always reorganize later — categories can be moved, renamed, and restructured without losing the items assigned to them.",
    ],
  },
  {
    id: "super",
    title: "Create Super Categories",
    description:
      "Super categories are the top level — they separate your inventory into major groups for independent tracking and reporting. Most operations use at least Food and Beverage.",
    hint: 'Click "Add Super Category" or "Bulk Add" below to create your first super categories.',
    icon: <FolderTree className="h-5 w-5" />,
    canAutoAdvance: true,
    tips: [
      'Match your super categories to your P&L line items. If your accountant reports "Cost of Food" and "Cost of Beverage" separately, those are your super categories.',
      "Common setups: Food + Beverage for restaurants, Food + Beverage + Supplies for hotels, or Food + Beverage + Retail for venues with gift shops.",
      'Consider adding a "Non-Perishable Supplies" super category for cleaning products, paper goods, and disposables if you want to track those costs separately from food and drink.',
    ],
  },
  {
    id: "categories",
    title: "Add Categories",
    description:
      "Now expand a super category and add categories under it. These represent your main product groupings — the level you'll most often filter and report on.",
    hint: 'Expand a super category, then click "Add Category" or "Bulk Add" to add several at once.',
    icon: <FolderOpen className="h-5 w-5" />,
    canAutoAdvance: true,
    tips: [
      "Structure categories around how you purchase and count inventory. If you order produce, dairy, and meat from different vendors or count them in different areas, those should be separate categories.",
      "For beverages, common categories include Liquor, Beer, Wine, and Non-Alcoholic. This mirrors how most bar inventories are physically organized and counted.",
      "If you assign GL codes at this level, every item underneath will inherit it — saving you from setting GL codes on hundreds of individual products.",
      "Keep the number of categories manageable (5-10 per super category). Too many makes reporting noisy; too few loses useful detail.",
    ],
  },
  {
    id: "subcategories",
    title: "Add Subcategories (Optional)",
    description:
      "Subcategories add a third level of detail. They're optional — items can be assigned directly to a category if you don't need this granularity.",
    hint: 'Expand a category and click "Add Subcategory" or "Bulk Add" to create them.',
    icon: <ChevronRight className="h-5 w-5" />,
    canAutoAdvance: true,
    tips: [
      "Subcategories are most useful for high-value or high-volume categories. Breaking Liquor into Rum, Vodka, Whiskey, etc. helps you spot which spirit type is driving cost variances.",
      "For food, subcategories work well for Produce (Leafy Greens, Root Vegetables, Fruits) or Protein (Beef, Poultry, Pork, Seafood) where you want tighter cost tracking.",
      "Skip subcategories for simple categories. If Dairy only has a few items, a subcategory layer just adds clicks without adding insight.",
      "Subcategories can have their own GL codes to override the parent — useful if your chart of accounts distinguishes between, say, draft beer and bottled beer.",
    ],
  },
  {
    id: "done",
    title: "You're All Set!",
    description:
      "Your category hierarchy is ready to go. When you add inventory items, you'll select from the categories you just created. You can come back anytime to add, edit, or reorganize.",
    hint: 'Click "Finish Setup" to dismiss this guide.',
    icon: <Check className="h-5 w-5" />,
    tips: [
      "GL codes cascade: item → subcategory → category → super category. Set them at the highest level that makes sense, then only override on specific items or subcategories that need a different code.",
      "Your next step is the Inventory page — add your products and assign them to the categories you've built here.",
      "Reports will automatically group by your category structure, so you can compare Food vs. Beverage costs, drill into specific categories, and track waste by product type.",
    ],
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
        return false;
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
