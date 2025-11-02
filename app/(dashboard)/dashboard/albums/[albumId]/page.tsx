import { notFound } from "next/navigation";

import { auth } from "@/auth";
import type { RoleKey } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { AlbumForm } from "@/components/forms/album-form";
import { DashboardHeading } from "@/components/layout/dashboard/dashboard-heading";
import { DashboardUnauthorized } from "@/components/layout/dashboard/dashboard-unauthorized";
import { AlbumStatus } from "@/lib/albums/types";

type EditAlbumPageProps = {
  params: Promise<{ albumId: string }>;
};

export default async function EditAlbumPage({ params }: EditAlbumPageProps) {
  const { albumId } = await params;
  const session = await auth();
  const role = (session?.user?.role ?? "AUTHOR") as RoleKey;

  if (!session?.user || !(role === "ADMIN" || role === "EDITOR")) {
    return (
      <DashboardUnauthorized description="Hanya Admin dan Editor yang dapat mengelola album." />
    );
  }

  const album = await prisma.album.findUnique({
    where: { id: albumId },
    include: {
      images: {
        include: {
          media: { select: { url: true } },
        },
        orderBy: { position: "asc" },
      },
    },
  });

  if (!album) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <DashboardHeading
        heading="Edit Album"
        description="Perbarui informasi album galeri dan kelola gambar yang ditampilkan."
      />
      <AlbumForm
        submitLabel="Simpan Perubahan"
        initialValues={{
          id: album.id,
          title: album.title,
          description: album.description ?? "",
          status: (album.status as AlbumStatus) ?? AlbumStatus.DRAFT,
          images: album.images.map((image) => ({
            id: image.id,
            url: image.media?.url ?? "",
            caption: image.caption ?? null,
          })),
        }}
      />
    </div>
  );
}
