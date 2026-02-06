"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateUserRole } from "@/actions/settings";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: Date;
}

interface UserManagementProps {
  users: User[];
  currentUserId: string;
}

export default function UserManagement({
  users,
  currentUserId,
}: UserManagementProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleRoleChange(userId: string, role: string) {
    setLoadingId(userId);
    const result = await updateUserRole(
      userId,
      role as "ADMIN" | "MANAGER" | "STAFF"
    );
    if (result.success) {
      toast.success("Role updated");
      router.refresh();
    } else {
      toast.error(result.error);
    }
    setLoadingId(null);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <p className="text-sm text-muted-foreground">No users found.</p>
        ) : (
          <div className="space-y-3">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="font-medium">
                    {user.name ?? "Unnamed"}{" "}
                    {user.id === currentUserId && (
                      <Badge variant="outline" className="ml-1">You</Badge>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Joined {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Select
                  value={user.role}
                  onValueChange={(val) => handleRoleChange(user.id, val)}
                  disabled={user.id === currentUserId || loadingId === user.id}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="STAFF">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
