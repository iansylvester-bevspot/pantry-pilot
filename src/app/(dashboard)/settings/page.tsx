import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUsers } from "@/actions/settings";
import PageHeader from "@/components/shared/page-header";
import ProfileForm from "@/components/settings/profile-form";
import UserManagement from "@/components/settings/user-management";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!dbUser) redirect("/login");

  const isAdmin = dbUser.role === "ADMIN";
  const users = isAdmin ? await getUsers() : [];

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Settings"
        description="Manage your account and preferences"
      />

      <ProfileForm
        user={{
          name: dbUser.name,
          email: dbUser.email,
          role: dbUser.role,
        }}
      />

      {isAdmin && (
        <UserManagement users={users} currentUserId={dbUser.id} />
      )}
    </div>
  );
}
