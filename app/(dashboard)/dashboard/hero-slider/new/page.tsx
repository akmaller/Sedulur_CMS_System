import Link from "next/link";

import { auth } from "@/auth";
import type { RoleKey } from "@/lib/auth/permissions";
import { DashboardHeading } from "@/components/layout/dashboard/dashboard-heading";
import { DashboardUnauthorized } from "@/components/layout/dashboard/dashboard-unauthorized";
import { buttonVariants } from "@/lib/button-variants";
import { prisma } from "@/lib/prisma";

import { HeroSlideForm } from "../_components/hero-slide-form";
import { createHeroSlideAction } from "../actions";

export default async function NewHeroSlidePage() {
  const session = await auth();
  const role = (session?.user?.role ?? "AUTHOR") as RoleKey;
  if (!session?.user || !(role === "ADMIN" || role === "EDITOR")) {
    return (
      <DashboardUnauthorized description="Hanya Admin dan Editor yang dapat menambahkan slide baru." />
    );
  }

  const media = await prisma.media.findMany({
    orderBy: { createdAt: "desc" },
    take: 12,
    select: {
      id: true,
      title: true,
      description: true,
      url: true,
      mimeType: true,
      size: true,
      createdAt: true,
    },
  });

  const mediaItems = media.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    url: item.url,
    mimeType: item.mimeType,
    size: item.size,
    createdAt: item.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <DashboardHeading
          heading="Slide Baru"
          description="Susun slide hero untuk menonjolkan pesan utama blog pribadi Anda."
        />
        <Link className={buttonVariants({ variant: "outline" })} href="/dashboard/hero-slider">
          Kembali ke daftar
        </Link>
      </div>
      <HeroSlideForm action={createHeroSlideAction} mediaItems={mediaItems} submitLabel="Simpan Slide" />
    </div>
  );
}
