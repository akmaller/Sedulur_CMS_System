import { AlbumStatus } from "@/lib/albums/types";
import { auth } from "@/auth";
import type { RoleKey } from "@/lib/auth/permissions";
import { DashboardHeading } from "@/components/layout/dashboard/dashboard-heading";
import { DashboardUnauthorized } from "@/components/layout/dashboard/dashboard-unauthorized";
import { AlbumForm } from "@/components/forms/album-form";

export default async function NewAlbumPage() {
  const session = await auth();
  const role = (session?.user?.role ?? "AUTHOR") as RoleKey;

  if (!session?.user || !(role === "ADMIN" || role === "EDITOR")) {
    return <DashboardUnauthorized description="Hanya Admin dan Editor yang dapat membuat album." />;
  }

  return (
    <div className="space-y-6">
      <DashboardHeading
        heading="Album Baru"
        description="Buat album galeri untuk menampilkan kumpulan foto pada halaman publik."
      />
      <AlbumForm submitLabel="Buat Album" initialValues={{ status: AlbumStatus.DRAFT }} />
    </div>
  );
}
