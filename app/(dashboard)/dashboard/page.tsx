import Link from "next/link";
import { ArticleStatus } from "@prisma/client";

import { auth } from "@/auth";
import type { RoleKey } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { DashboardHeading } from "@/components/layout/dashboard/dashboard-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const quickActions: Array<{ title: string; description: string; href: string; roles: RoleKey[] }> = [
  {
    title: "Tulis Artikel Baru",
    description: "Mulai cerita terbaru untuk pembaca setia Anda.",
    href: "/dashboard/articles/new",
    roles: ["ADMIN", "EDITOR", "AUTHOR"],
  },
  {
    title: "Kelola Hero Slider",
    description: "Susun slide hero agar pesan utama selalu relevan.",
    href: "/dashboard/hero-slider",
    roles: ["ADMIN", "EDITOR"],
  },
  {
    title: "Unggah Media",
    description: "Tambahkan aset visual untuk memperkuat konten.",
    href: "/dashboard/media",
    roles: ["ADMIN", "EDITOR", "AUTHOR"],
  },
  {
    title: "Pengaturan Situs",
    description: "Atur identitas brand, metadata, dan warna tampilan.",
    href: "/dashboard/settings/general",
    roles: ["ADMIN"],
  },
];

export default async function DashboardHomePage() {
  const session = await auth();
  const role = (session?.user?.role ?? "AUTHOR") as RoleKey;
  const displayName = session?.user?.name?.split(" ")[0] ?? "Admin";

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [publishedArticles, draftArticles, activeSlides, totalSlides, uniqueVisits, recentArticles] =
    await Promise.all([
      prisma.article.count({ where: { status: ArticleStatus.PUBLISHED } }),
      prisma.article.count({ where: { status: { not: ArticleStatus.PUBLISHED } } }),
      prisma.heroSlide.count({ where: { isActive: true } }),
      prisma.heroSlide.count(),
      prisma.visitLog.findMany({
        where: { createdAt: { gte: startOfMonth } },
        select: { ip: true },
        distinct: ["ip"],
      }),
      prisma.article.findMany({
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          status: true,
          updatedAt: true,
          slug: true,
        },
      }),
    ]);

  const stats = [
    {
      label: "Artikel Terbit",
      value: publishedArticles,
      description: "Total artikel yang sudah tayang",
    },
    {
      label: "Draft Pending",
      value: draftArticles,
      description: "Artikel yang siap dilanjutkan",
    },
    {
      label: "Hero Slide Aktif",
      value: activeSlides,
      description: `${activeSlides}/${totalSlides} slide aktif`,
    },
    {
      label: "Kunjungan Bulan Ini",
      value: uniqueVisits.length,
      description: "IP unik yang tercatat",
    },
  ];

  const availableActions = quickActions.filter((action) => action.roles.includes(role));

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <DashboardHeading
          heading={`Selamat datang, ${displayName}`}
          description="Ringkasan singkat performa blog pribadi Anda."
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <Card key={item.label} className="border-border/60 bg-card/60">
            <CardHeader className="space-y-1">
              <CardTitle className="text-sm font-semibold uppercase tracking-[0.35em] text-muted-foreground">
                {item.label}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground/80">
                {item.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-foreground">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card className="border-border/60 bg-card/60">
          <CardHeader>
            <CardTitle>Artikel Terbaru</CardTitle>
            <CardDescription>Lima artikel terakhir yang Anda simpan atau publikasikan.</CardDescription>
          </CardHeader>
          <CardContent>
            {recentArticles.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada artikel. Yuk tulis artikel perdana!</p>
            ) : (
              <div className="space-y-3">
                {recentArticles.map((article) => {
                  const isPublished = article.status === ArticleStatus.PUBLISHED;
                  return (
                    <div
                      key={article.id}
                      className="flex flex-col gap-2 rounded-xl border border-border/50 bg-background/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-medium text-foreground">{article.title}</p>
                        <p className="text-xs text-muted-foreground">
                          Diperbarui {new Date(article.updatedAt).toLocaleString("id-ID")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={isPublished ? "default" : "secondary"}>
                          {isPublished ? "Terbit" : "Draft"}
                        </Badge>
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/dashboard/articles/${article.id}`}>Kelola</Link>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60">
          <CardHeader>
            <CardTitle>Aksi Cepat</CardTitle>
            <CardDescription>Pilih langkah yang ingin Anda lakukan selanjutnya.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {availableActions.map((action) => (
              <div key={action.href} className="rounded-xl border border-border/50 bg-background/30 p-4">
                <p className="text-sm font-semibold text-foreground">{action.title}</p>
                <p className="text-xs text-muted-foreground">{action.description}</p>
                <Button asChild size="sm" className="mt-3">
                  <Link href={action.href}>Buka</Link>
                </Button>
              </div>
            ))}
            {availableActions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Tidak ada aksi khusus untuk peran Anda saat ini.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
