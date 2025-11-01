import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { ArticleStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getSiteConfig } from "@/lib/site-config/server";
import { createMetadata } from "@/lib/seo/metadata";
import { logPageView } from "@/lib/visits/log-page-view";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/datetime/relative";
import { Card, CardContent } from "@/components/ui/card";

import { HeroSlider, type HeroSlideItem } from "./(components)/hero-slider";

type HeroSlideWithImage = Prisma.HeroSlideGetPayload<{
  include: {
    image: {
      select: {
        url: true;
        title: true;
        width: true | null;
        height: true | null;
      };
    };
  };
}>;

const FEATURED_PARTNERS = [
  "Blizzard",
  "Sprint",
  "Tesla",
  "CNN",
  "CBS",
  "Rolex",
  "Coca-Cola",
  "Time Inc.",
];

export async function generateMetadata(): Promise<Metadata> {
  const config = await getSiteConfig();
  const baseTitle = config.metadata.title ?? config.name;
  const description = config.metadata.description ?? config.description;

  const metadata = await createMetadata({
    config,
    title: baseTitle,
    description,
    path: "/",
    image: config.ogImage
      ? {
          url: config.ogImage,
          alt: config.name,
        }
      : null,
  });

  return {
    ...metadata,
    title: {
      default: baseTitle,
      template: `%s | ${config.name}`,
    },
  };
}

function resolveHeroSlides(
  slides: HeroSlideWithImage[],
  fallback: HeroSlideItem,
): HeroSlideItem[] {
  if (slides.length === 0) {
    return [fallback];
  }

  return slides.map((slide) => ({
    id: slide.id,
    title: slide.title,
    subtitle: slide.subtitle ?? fallback.subtitle,
    description: slide.description ?? fallback.description,
    buttonLabel: slide.buttonLabel ?? fallback.buttonLabel,
    buttonUrl: slide.buttonUrl ?? fallback.buttonUrl,
    imageUrl: slide.image?.url ?? slide.imageUrl ?? fallback.imageUrl,
  }));
}

function formatPublishedLabel(date: Date | string | null | undefined) {
  return formatRelativeTime(date) ?? "-";
}

function getPrimaryCategory(article: {
  categories: { category: { id: string; name: string; slug: string } }[];
}) {
  return article.categories[0]?.category ?? null;
}

export default async function HomePage() {
  const [siteConfig, heroSlidesRaw, latestArticles] = await Promise.all([
    getSiteConfig(),
    prisma.heroSlide.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      include: {
        image: {
          select: {
            url: true,
            title: true,
            width: true,
            height: true,
          },
        },
      },
    }),
    prisma.article.findMany({
      where: { status: ArticleStatus.PUBLISHED },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 6,
      include: {
        featuredMedia: {
          select: {
            url: true,
            title: true,
            width: true,
            height: true,
          },
        },
        categories: {
          include: { category: true },
          orderBy: { assignedAt: "asc" },
        },
      },
    }),
  ]);

  const fallbackHero: HeroSlideItem = {
    id: "fallback-hero",
    title: siteConfig.metadata.title ?? siteConfig.name,
    subtitle: siteConfig.tagline ?? "Personal Blog",
    description: siteConfig.description,
    buttonLabel: "Jelajahi Blog",
    buttonUrl: "/articles",
    imageUrl: "/images/hero/portrait-primary.svg",
  };

  const heroSlides = resolveHeroSlides(heroSlidesRaw, fallbackHero);
  const firstName = siteConfig.name.split(" ")[0] ?? siteConfig.name;
  const latestPostCards = latestArticles.slice(0, 3);

  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const userAgent = headerList.get("user-agent");
  const referrer = headerList.get("referer");
  const protocol = headerList.get("x-forwarded-proto") ?? "https";
  const host = headerList.get("host");
  const fullUrl = host ? `${protocol}://${host}/` : undefined;

  await logPageView({
    path: "/",
    url: fullUrl,
    referrer,
    ip,
    userAgent,
  });

  return (
    <div className="flex flex-col gap-20 pb-24 pt-8">
      <section className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <HeroSlider
          slides={heroSlides}
          siteName={siteConfig.name}
          tagline={siteConfig.tagline ?? null}
        />
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 text-center sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-xs font-medium uppercase tracking-[0.4em] text-muted-foreground/80 sm:text-sm">
          {FEATURED_PARTNERS.map((partner) => (
            <span key={partner} className="opacity-80">
              {partner}
            </span>
          ))}
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:gap-12 lg:px-8">
        <div className="space-y-6">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary/90">
            Work With {firstName}
          </p>
          <h2 className="font-display text-3xl tracking-tight text-foreground sm:text-4xl">
            {siteConfig.description}
          </h2>
          <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
            Saya membantu brand, pebisnis kreatif, dan komunitas untuk tumbuh lewat strategi
            pemasaran yang manusiawi, storytelling yang relevan, serta pengalaman digital yang
            konsisten. Kolaborasi dimulai dengan mendengarkan: mari cari tahu bagaimana kita bisa
            menciptakan dampak.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/contact"
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-12 rounded-full bg-primary px-6 text-base font-semibold text-primary-foreground transition hover:bg-primary/90",
              )}
            >
              Jadwalkan Konsultasi
            </Link>
            <Link
              href="/about"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-12 rounded-full border-primary/40 bg-transparent px-6 text-base font-semibold text-primary transition hover:border-primary hover:bg-primary/10",
              )}
            >
              Tentang Saya
            </Link>
          </div>
        </div>

        <Card className="border border-border/50 bg-card/40 px-6 py-8 shadow-lg shadow-black/10 backdrop-blur">
          <CardContent className="space-y-6 p-0">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary/90">
                Newsletter Eksklusif
              </p>
              <h3 className="mt-2 font-display text-2xl text-foreground">
                Dapatkan insight marketing terbaru setiap minggu.
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Saya mengkurasi eksperimen, strategi, dan template kerja yang bisa langsung Anda
              terapkan untuk memperkuat suara brand dan komunitas.
            </p>
            <form className="space-y-3">
              <input
                type="email"
                name="email"
                placeholder="Alamat email Anda"
                className="h-12 w-full rounded-full border border-border/60 bg-background/40 px-5 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                aria-label="Alamat email Anda"
              />
              <button
                type="submit"
                className="flex h-12 w-full items-center justify-center rounded-full bg-primary text-base font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                Bergabung Sekarang
              </button>
            </form>
          </CardContent>
        </Card>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary/90">
              Tulisan Terbaru
            </p>
            <h2 className="font-display text-3xl tracking-tight text-foreground sm:text-4xl">
              Cerita, analisis, dan eksperimen terbaru.
            </h2>
          </div>
          <Link
            href="/articles"
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "inline-flex h-10 items-center rounded-full border border-border/50 px-5 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary",
            )}
          >
            Lihat semua artikel
          </Link>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {latestPostCards.map((article) => {
            const primaryCategory = getPrimaryCategory(article);
            const publishedLabel = formatPublishedLabel(article.publishedAt ?? article.createdAt);
            const imageUrl = article.featuredMedia?.url ?? null;

            return (
              <Link
                key={article.id}
                href={`/articles/${article.slug}`}
                className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border/40 bg-card/50 shadow-lg shadow-black/10 transition hover:-translate-y-1 hover:border-primary/60 hover:shadow-xl hover:shadow-primary/10"
              >
                <div className="relative overflow-hidden">
                  <div className="absolute inset-0 rounded-b-[48px] bg-gradient-to-b from-transparent via-background/20 to-background/80 opacity-0 transition duration-500 group-hover:opacity-100" />
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={article.featuredMedia?.title ?? article.title}
                      width={600}
                      height={400}
                      className="h-48 w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-48 w-full items-center justify-center bg-secondary/40 text-sm font-semibold uppercase tracking-[0.35em] text-muted-foreground">
                      {primaryCategory?.name ?? "Artikel"}
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-4 p-6">
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-muted-foreground">
                    <span>{primaryCategory?.name ?? "Artikel"}</span>
                    <span>{publishedLabel}</span>
                  </div>
                  <h3 className="font-display text-xl text-foreground transition group-hover:text-primary">
                    {article.title}
                  </h3>
                  {article.excerpt ? (
                    <p className="line-clamp-3 text-sm text-muted-foreground">{article.excerpt}</p>
                  ) : null}
                  <span className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-primary">
                    Baca selengkapnya
                    <span aria-hidden className="transition group-hover:translate-x-1">
                      →
                    </span>
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
