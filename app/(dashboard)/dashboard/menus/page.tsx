import { Suspense } from "react";
import { ArticleStatus } from "@prisma/client";

import { auth } from "@/auth";
import type { RoleKey } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { DashboardHeading } from "@/components/layout/dashboard/dashboard-heading";
import { DashboardUnauthorized } from "@/components/layout/dashboard/dashboard-unauthorized";
import { MenuBuilder } from "@/components/menu/menu-builder";
import { MenuSelector } from "@/components/menu/menu-selector";
import { MenuItemForm } from "@/components/forms/menu-item-form";
import { getMenuTree } from "@/lib/menu/server";
import { flattenMenuTree } from "@/lib/menu/utils";

const FALLBACK_MENUS = ["main", "footer"] as const;

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DashboardMenusPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const session = await auth();
  const role = (session?.user?.role ?? "AUTHOR") as RoleKey;

  if (!session?.user || !(role === "ADMIN" || role === "EDITOR")) {
    return (
      <DashboardUnauthorized description="Hanya Admin dan Editor yang dapat mengatur menu publik." />
    );
  }

  const distinctMenus = await prisma.menuItem.findMany({
    select: { menu: true },
    distinct: ["menu"],
    orderBy: { menu: "asc" },
  });

  const menus = Array.from(
    new Set<string>([...distinctMenus.map((item) => item.menu), ...FALLBACK_MENUS])
  );

  const requestedMenuParam = params?.menu;
  const requestedMenu = typeof requestedMenuParam === "string" ? requestedMenuParam : null;
  const activeMenu = requestedMenu && menus.includes(requestedMenu) ? requestedMenu : menus[0] ?? "main";

  const [menuTree, pages, categories, albums] = await Promise.all([
    getMenuTree(activeMenu),
    prisma.page.findMany({
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    }),
    prisma.category.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    }),
    prisma.album.findMany({
      where: { status: ArticleStatus.PUBLISHED },
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    }),
  ]);

  const parentOptions = flattenMenuTree(menuTree).map((item) => ({
    id: item.id,
    title: `${"— ".repeat(item.depth)}${item.title}`.trim(),
  }));

  const pageOptions = pages.map((page) => ({ id: page.id, title: page.title }));
  const categoryOptions = categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
  }));
  const albumOptions = albums.map((album) => ({ id: album.id, title: album.title }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <DashboardHeading
          heading="Navigasi Publik"
          description="Kelola tautan yang muncul pada topbar dan footer situs."
        />
        <Suspense>
          <MenuSelector menus={menus} />
        </Suspense>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <MenuBuilder
          menu={activeMenu}
          items={menuTree}
          pages={pageOptions}
          categories={categoryOptions}
          albums={albumOptions}
        />
        <MenuItemForm
          menu={activeMenu}
          parents={parentOptions}
          pages={pageOptions}
          categories={categoryOptions}
          albums={albumOptions}
        />
      </div>
    </div>
  );
}
