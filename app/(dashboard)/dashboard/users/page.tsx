import { auth } from "@/auth";
import type { RoleKey } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { DashboardHeading } from "@/components/layout/dashboard/dashboard-heading";
import { DashboardUnauthorized } from "@/components/layout/dashboard/dashboard-unauthorized";
import { UserForm } from "@/components/forms/user-form";
import { UserList } from "@/components/forms/user-list";

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
      emailVerified: true,
      canPublish: true,
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

        <UserList
          users={users.map((user) => ({
            ...user,
            createdAt: user.createdAt.toISOString(),
            emailVerified: user.emailVerified ? user.emailVerified.toISOString() : null,
          }))}
          currentUserId={session.user.id}
        />
      </div>
    </div>
  );
}
