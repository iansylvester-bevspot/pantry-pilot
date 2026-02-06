"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type CategoryWithGl = {
  glCode: string | null;
  name: string;
  parent?: {
    glCode: string | null;
    name: string;
    parent?: { glCode: string | null; name: string } | null;
  } | null;
};

/** Resolves the effective GL code by walking up the category chain */
export function resolveGlCode(
  itemGlCode: string | null | undefined,
  category?: CategoryWithGl | null
): { code: string | null; source: string } {
  if (itemGlCode) return { code: itemGlCode, source: "Item" };
  if (category?.glCode) return { code: category.glCode, source: category.name };
  if (category?.parent?.glCode)
    return { code: category.parent.glCode, source: category.parent.name };
  if (category?.parent?.parent?.glCode)
    return {
      code: category.parent.parent.glCode,
      source: category.parent.parent.name,
    };
  return { code: null, source: "" };
}

export function GlCodeBadge({
  itemGlCode,
  category,
}: {
  itemGlCode?: string | null;
  category?: CategoryWithGl | null;
}) {
  const { code, source } = resolveGlCode(itemGlCode, category);

  if (!code) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="font-mono text-xs">
            GL: {code}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            Inherited from: <span className="font-medium">{source}</span>
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
