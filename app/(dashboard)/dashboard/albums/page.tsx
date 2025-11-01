import Image from "next/image";
import Link from "next/link";

import { ArticleStatus } from "@prisma/client";

import { auth } from "@/auth";
import type { RoleKey } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { DashboardHeading } from "@/components/layout/dashboard/dashboard-heading";
import { DashboardUnauthorized } from "@/components/layout/dashboard/dashboard-unauthorized";
import { buttonVariants } from "@/lib/button-variants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRelativeTime } from "@/lib/datetime/relative";

export default async function DashboardAlbumsPage() {
  const session = await auth();
  const role = (session?.user?.role ?? "AUTHOR") as RoleKey;

  if (!session?.user || !(role === "ADMIN" || role === "EDITOR")) {
    return (
      <DashboardUnauthorized description="Hanya Admin dan Editor yang dapat mengelola album." />
    );
  }

  const albums = await prisma.album.findMany({
    orderBy: [{ createdAt: "desc" }],
    include: {
      images: { include: { media: true }, orderBy: { position: "asc" } },
      createdBy: { select: { name: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <DashboardHeading
          heading="Album Galeri"
          description="Kelola kumpulan foto untuk ditampilkan pada halaman publik."
        />
        <Link className={buttonVariants()} href="/dashboard/albums/new">
          Album Baru
        </Link>
      </div>

      {albums.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Belum ada album. Mulai dengan menambahkan album baru dan unggah foto-fotonya.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {albums.map((album) => {
            const cover = album.images[0]?.media ?? null;
            const statusLabel = album.status === ArticleStatus.PUBLISHED ? "Terbit" : "Draft";
            const statusColor = album.status === ArticleStatus.PUBLISHED ? "text-primary" : "text-muted-foreground";
            return (
              <Card key={album.id} className="border-border/60 bg-card/60">
                {cover ? (
                  <div className="relative h-40 w-full overflow-hidden rounded-t-lg">
                    <Image
                      src={cover.url}
                      alt={cover.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    />
                  </div>
                ) : null}
                <CardHeader className="space-y-2">
                  <CardTitle className="text-lg font-semibold text-foreground">{album.title}</CardTitle>
                  <CardDescription className="flex flex-wrap items-center gap-2 text-xs">
                    <span className={statusColor}>{statusLabel}</span>
                    <span aria-hidden>•</span>
                    <span>{formatRelativeTime(album.updatedAt)}</span>
                    <span aria-hidden>•</span>
                    <span>Oleh {album.createdBy?.name ?? "Tidak diketahui"}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between text-sm">
                  <span>{album.images.length} foto</span>
                  <Link href={`/dashboard/albums/${album.id}`} className={buttonVariants({ size: "sm", variant: "outline" })}>
                    Kelola
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
