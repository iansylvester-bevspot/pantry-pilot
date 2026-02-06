import { auth } from "@/auth";
import { UserRole } from "@/generated/prisma/client";

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user) return null;
  return session.user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

export async function requireRole(roles: UserRole[]) {
  const user = await requireAuth();
  if (!roles.includes(user.role as UserRole)) {
    throw new Error("Insufficient permissions");
  }
  return user;
}
