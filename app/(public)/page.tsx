import type { Metadata } from "next";
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
import { serializePublicArticle, publicArticleInclude } from "@/lib/articles/public";

import { HeroSlider, type HeroSlideItem } from "./(components)/hero-slider";
import { LatestArticlesGrid } from "./(components)/latest-articles-grid";

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
  const [siteConfig, heroSlidesRaw, latestArticles, featuredArticle, totalPublishedArticles] = await Promise.all([
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
      take: 12,
      include: publicArticleInclude,
    }),
    prisma.article.findFirst({
      where: {
        status: ArticleStatus.PUBLISHED,
        categories: {
          some: {
            category: {
              slug: "featured",
            },
          },
        },
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
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
    prisma.article.count({ where: { status: ArticleStatus.PUBLISHED } }),
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
  const latestPosts = latestArticles.slice(0, 3);
  const featuredPost = featuredArticle ?? null;
  const pageSize = 9;
  const baseIndex = 2;
  const gridSource = latestArticles.slice(baseIndex);
  const initialGridArticles = gridSource.slice(0, pageSize).map(serializePublicArticle);
  const hasBaseArticles = totalPublishedArticles > baseIndex;
  const initialHasMore = totalPublishedArticles > baseIndex + initialGridArticles.length;

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
    <div className="relative">
      <HeroSlider
        slides={heroSlides}
        siteName={siteConfig.name}
        tagline={siteConfig.tagline ?? null}
      />

      <div className="relative z-10 flex flex-col gap-20 pb-24 pt-[100vh]">
        <section className="mx-auto grid w-full max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:gap-12 lg:px-8">
          <div className="flex h-full flex-col">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary/90">
              Highlight Unggulan
            </p>
            <div className="mt-6 flex-1">
              {featuredPost ? (
                <Link
                  href={`/articles/${featuredPost.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-3xl border border-primary/40 bg-primary/5 p-8 shadow-lg shadow-primary/10 transition hover:-translate-y-1 hover:border-primary/70 hover:shadow-xl hover:shadow-primary/20"
                >
                  <div className="flex flex-1 flex-col gap-4">
                    <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.3em] text-primary">
                      <span>
                        {featuredPost.categories.find((cat) => cat.category.slug === "featured")?.category
                          .name ?? "Featured"}
                      </span>
                      <span>{formatPublishedLabel(featuredPost.publishedAt ?? featuredPost.createdAt)}</span>
                    </div>
                    <h3 className="font-display text-2xl text-foreground transition group-hover:text-primary">
                      {featuredPost.title}
                    </h3>
                    {featuredPost.excerpt ? (
                      <p className="text-base text-muted-foreground">{featuredPost.excerpt}</p>
                    ) : null}
                    <span className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-primary">
                      Baca sekarang
                      <span aria-hidden className="transition group-hover:translate-x-1">→</span>
                    </span>
                  </div>
                </Link>
              ) : (
                <div className="flex h-full flex-col items-start justify-center rounded-3xl border border-border/50 bg-card/40 p-10 text-left shadow-lg shadow-black/10">
                  <p className="text-base text-muted-foreground">
                    Belum ada artikel yang ditandai sebagai unggulan. Tandai salah satu artikel dengan
                    kategori <span className="font-semibold text-primary">Featured</span> untuk
                    menampilkannya di sini.
                  </p>
                  <Link
                    href="/dashboard/articles"
                    className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-primary/80"
                  >
                    Kelola artikel
                    <span aria-hidden>→</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
          <div className="flex h-full flex-col gap-6 rounded-3xl border border-border/50 bg-card/40 px-6 py-8 shadow-lg shadow-black/10 backdrop-blur">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary/90">
                Artikel Terbaru
              </p>
            </div>
            <ul className="space-y-4">
              {latestPosts.length === 0 ? (
                <li className="text-sm text-muted-foreground">
                  Belum ada artikel yang diterbitkan. Nantikan insight terbaru di blog ini.
                </li>
              ) : (
                latestPosts.slice(0, 2).map((article) => {
                  const primaryCategory = getPrimaryCategory(article);
                  const publishedLabel = formatPublishedLabel(article.publishedAt ?? article.createdAt);

                  return (
                    <li key={article.id}>
                      <Link
                        href={`/articles/${article.slug}`}
                        className="group flex flex-col rounded-2xl border border-border/50 bg-background/30 px-5 py-4 transition hover:border-primary/50 hover:bg-primary/5"
                      >
                        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                          <span>{primaryCategory?.name ?? "Artikel"}</span>
                          <span>{publishedLabel}</span>
                        </div>
                        <h4 className="mt-2 font-display text-lg text-foreground transition group-hover:text-primary">
                          {article.title}
                        </h4>
                        {article.excerpt ? (
                          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{article.excerpt}</p>
                        ) : null}
                      </Link>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary/90">
                Tulisan Terbaru
              </p>
              <h2 className="font-display text-3xl tracking-tight text-foreground sm:text-4xl">
                Cerita, analisis, dan tulisan terbaru.
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

          <LatestArticlesGrid
            initialArticles={initialGridArticles}
            pageSize={pageSize}
            baseIndex={baseIndex}
            hasBaseArticles={hasBaseArticles}
            initialHasMore={initialHasMore}
          />
        </section>
      </div>
    </div>
  );
}
