import Link from "next/link";

import { auth } from "@/auth";
import type { RoleKey } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { buttonVariants } from "@/lib/button-variants";
import { DashboardHeading } from "@/components/layout/dashboard/dashboard-heading";
import { DashboardUnauthorized } from "@/components/layout/dashboard/dashboard-unauthorized";

import { HeroSlideList } from "./_components/hero-slide-list";

export default async function HeroSliderDashboardPage() {
  const session = await auth();
  const role = (session?.user?.role ?? "AUTHOR") as RoleKey;
  if (!session?.user || !(role === "ADMIN" || role === "EDITOR")) {
    return (
      <DashboardUnauthorized description="Hanya Admin dan Editor yang dapat mengatur hero slider." />
    );
  }

  const slides = await prisma.heroSlide.findMany({
    orderBy: { order: "asc" },
    select: {
      id: true,
      title: true,
      subtitle: true,
      buttonLabel: true,
      imageUrl: true,
      isActive: true,
      order: true,
      updatedAt: true,
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <DashboardHeading
          heading="Hero Slider"
          description="Atur slide pada hero utama beranda, lengkap dengan judul, deskripsi, dan gambar."
        />
        <Link className={buttonVariants()} href="/dashboard/hero-slider/new">
          Tambah Slide
        </Link>
      </div>
      <HeroSlideList
        slides={slides.map((slide) => ({
          id: slide.id,
          title: slide.title,
          subtitle: slide.subtitle,
          buttonLabel: slide.buttonLabel,
          imageUrl: slide.imageUrl,
          isActive: slide.isActive,
          order: slide.order,
          updatedAt: slide.updatedAt.toISOString(),
        }))}
      />
    </div>
  );
}
