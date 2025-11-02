import { auth } from "@/auth";
import type { RoleKey } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { DashboardHeading } from "@/components/layout/dashboard/dashboard-heading";
import { DashboardUnauthorized } from "@/components/layout/dashboard/dashboard-unauthorized";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserForm } from "@/components/forms/user-form";

function resolveRoleBadge(role: string) {
  switch (role) {
    case "ADMIN":
      return { label: "Admin", variant: "default" as const };
    case "EDITOR":
      return { label: "Editor", variant: "secondary" as const };
    default:
      return { label: "Author", variant: "outline" as const };
  }
}

export default async function DashboardUsersPage() {
  const session = await auth();
  const role = (session?.user?.role ?? "AUTHOR") as RoleKey;

  if (!session?.user || role !== "ADMIN") {
    return <DashboardUnauthorized description="Hanya Admin yang dapat mengelola pengguna." />;
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <DashboardHeading
        heading="Manajemen Pengguna"
        description="Tambahkan atau tinjau akun internal yang memiliki akses ke dashboard."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <UserForm />

        <Card className="border-border/60 bg-card/60">
          <CardHeader>
            <CardTitle>Daftar Pengguna</CardTitle>
            <CardDescription>Total {users.length} pengguna terdaftar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {users.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada pengguna. Tambahkan akun pertama Anda.</p>
            ) : (
              <div className="space-y-2">
                {users.map((user) => {
                  const badge = resolveRoleBadge(user.role);
                  return (
                    <div
                      key={user.id}
                      className="flex flex-col gap-1 rounded-lg border border-border/60 bg-background/40 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium text-foreground">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
