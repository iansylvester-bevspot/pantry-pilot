"use client";

import { ChevronRight } from "lucide-react";

type CategoryWithParents = {
  name: string;
  parent?: { name: string; parent?: { name: string } | null } | null;
};

export function CategoryBreadcrumb({
  category,
}: {
  category: CategoryWithParents;
}) {
  const parts: string[] = [];
  if (category.parent?.parent) parts.push(category.parent.parent.name);
  if (category.parent) parts.push(category.parent.name);
  parts.push(category.name);

  return (
    <span className="inline-flex items-center gap-1 text-sm">
      {parts.map((part, i) => (
        <span key={i} className="inline-flex items-center gap-1">
          {i > 0 && (
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
          )}
          <span className={i === parts.length - 1 ? "font-medium" : "text-muted-foreground"}>
            {part}
          </span>
        </span>
      ))}
    </span>
  );
}
