import Link from "next/link";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import type { RoleKey } from "@/lib/auth/permissions";
import { DashboardHeading } from "@/components/layout/dashboard/dashboard-heading";
import { DashboardUnauthorized } from "@/components/layout/dashboard/dashboard-unauthorized";
import { buttonVariants } from "@/lib/button-variants";
import { prisma } from "@/lib/prisma";

import { HeroSlideForm } from "../_components/hero-slide-form";
import { updateHeroSlideAction } from "../actions";

export default async function EditHeroSlidePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const role = (session?.user?.role ?? "AUTHOR") as RoleKey;
  if (!session?.user || !(role === "ADMIN" || role === "EDITOR")) {
    return (
      <DashboardUnauthorized description="Hanya Admin dan Editor yang dapat mengubah slide." />
    );
  }

  const slide = await prisma.heroSlide.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      subtitle: true,
      description: true,
      buttonLabel: true,
      buttonUrl: true,
      imageId: true,
      imageUrl: true,
      isActive: true,
    },
  });

  if (!slide) {
    notFound();
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
          heading="Ubah Slide"
          description="Perbarui konten hero agar selaras dengan kampanye terbaru."
        />
        <Link className={buttonVariants({ variant: "outline" })} href="/dashboard/hero-slider">
          Kembali ke daftar
        </Link>
      </div>
      <HeroSlideForm
        action={updateHeroSlideAction.bind(null, slide.id)}
        mediaItems={mediaItems}
        submitLabel="Perbarui Slide"
        initialValues={{
          title: slide.title,
          subtitle: slide.subtitle,
          description: slide.description,
          buttonLabel: slide.buttonLabel,
          buttonUrl: slide.buttonUrl,
          imageId: slide.imageId,
          imageUrl: slide.imageUrl,
          isActive: slide.isActive,
        }}
      />
    </div>
  );
}
