import { UserRole } from "@/generated/prisma/client";

export type Permission =
  | "inventory:read"
  | "inventory:create"
  | "inventory:update"
  | "inventory:delete"
  | "inventory:adjust_stock"
  | "categories:manage"
  | "suppliers:read"
  | "suppliers:create"
  | "suppliers:update"
  | "suppliers:delete"
  | "orders:read"
  | "orders:create"
  | "orders:approve"
  | "orders:receive"
  | "waste:read"
  | "waste:create"
  | "reports:view"
  | "locations:manage"
  | "users:manage";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: [
    "inventory:read",
    "inventory:create",
    "inventory:update",
    "inventory:delete",
    "inventory:adjust_stock",
    "categories:manage",
    "suppliers:read",
    "suppliers:create",
    "suppliers:update",
    "suppliers:delete",
    "orders:read",
    "orders:create",
    "orders:approve",
    "orders:receive",
    "waste:read",
    "waste:create",
    "reports:view",
    "locations:manage",
    "users:manage",
  ],
  MANAGER: [
    "inventory:read",
    "inventory:create",
    "inventory:update",
    "inventory:adjust_stock",
    "categories:manage",
    "suppliers:read",
    "suppliers:create",
    "suppliers:update",
    "orders:read",
    "orders:create",
    "orders:approve",
    "orders:receive",
    "waste:read",
    "waste:create",
    "reports:view",
  ],
  STAFF: [
    "inventory:read",
    "inventory:adjust_stock",
    "suppliers:read",
    "orders:read",
    "orders:receive",
    "waste:read",
    "waste:create",
  ],
};

export function hasPermission(
  role: UserRole,
  permission: Permission
): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function requirePermission(
  role: UserRole,
  permission: Permission
): void {
  if (!hasPermission(role, permission)) {
    throw new Error(`Insufficient permissions: requires ${permission}`);
  }
}
