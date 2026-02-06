"use client";

import { Lightbulb } from "lucide-react";
import type { CategoryType } from "@/generated/prisma/client";

const TIPS: Record<CategoryType, string[]> = {
  SUPER: [
    "Match these to your P&L line items (e.g., Cost of Food, Cost of Beverage).",
    "Most operations start with Food and Beverage.",
    "Consider adding Supplies for non-perishables you want to track separately.",
  ],
  CATEGORY: [
    "Group by how you purchase and count (e.g., Produce, Dairy, Meat).",
    "GL codes set here are inherited by all items underneath.",
    "5-10 categories per super category is a good balance for reporting.",
  ],
  SUBCATEGORY: [
    "Best for high-value groups like Liquor (Rum, Vodka, Whiskey).",
    "Skip these for simple categories with only a few items.",
    "GL codes here override the parent category's code.",
  ],
};

function TipList({ tips }: { tips: string[] }) {
  return (
    <>
      <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2">
        <Lightbulb className="h-3.5 w-3.5" />
        Quick Tips
      </div>
      <ul className="space-y-1.5">
        {tips.map((tip, i) => (
          <li
            key={i}
            className="text-xs text-amber-900/70 dark:text-amber-200/70 leading-relaxed pl-3 relative before:content-[''] before:absolute before:left-0 before:top-[7px] before:h-1 before:w-1 before:rounded-full before:bg-amber-400/60"
          >
            {tip}
          </li>
        ))}
      </ul>
    </>
  );
}

export function FormTipBubble({ type }: { type: CategoryType }) {
  const tips = TIPS[type];
  if (!tips || tips.length === 0) return null;

  return (
    <>
      {/* Large screens: speech bubble positioned to the right of dialog */}
      <div className="hidden xl:block absolute top-4 left-full ml-4 w-64">
        <div className="relative rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40 p-3 shadow-lg">
          {/* Left-pointing arrow */}
          <div className="absolute top-5 -left-2 w-0 h-0 border-y-[8px] border-y-transparent border-r-[8px] border-r-amber-50 dark:border-r-amber-950/40" />
          <TipList tips={tips} />
        </div>
      </div>

      {/* Smaller screens: inline callout */}
      <div className="xl:hidden rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/30 p-3">
        <TipList tips={tips} />
      </div>
    </>
  );
}
