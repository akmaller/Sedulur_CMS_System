"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/datetime/relative";
import type { PublicArticle } from "@/lib/articles/public";

type LatestArticlesGridProps = {
  initialArticles: PublicArticle[];
  pageSize: number;
  baseIndex: number;
  hasBaseArticles: boolean;
  initialHasMore: boolean;
};

type FetchResponse = {
  articles: PublicArticle[];
};

export function LatestArticlesGrid({
  initialArticles,
  pageSize,
  baseIndex,
  hasBaseArticles,
  initialHasMore,
}: LatestArticlesGridProps) {
  const [articles, setArticles] = useState<PublicArticle[]>(initialArticles);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoadMore = async () => {
    if (isLoading || !hasMore) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const skip = baseIndex + articles.length;
      const params = new URLSearchParams({
        skip: String(skip),
        take: String(pageSize),
      });
      const response = await fetch(`/api/public/articles?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Gagal memuat artikel selanjutnya.");
      }

      const payload = (await response.json()) as FetchResponse;
      const fetched = Array.isArray(payload.articles) ? payload.articles : [];

      if (fetched.length === 0) {
        setHasMore(false);
        return;
      }

      setArticles((prev) => [...prev, ...fetched]);
      if (fetched.length < pageSize) {
        setHasMore(false);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Terjadi kesalahan saat memuat artikel.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderEmptyState = () => (
    <div className="md:col-span-3">
      <div className="rounded-3xl border border-border/40 bg-card/40 p-8 text-center text-muted-foreground">
        {hasBaseArticles
          ? "Tidak ada artikel lagi untuk ditampilkan saat ini."
          : "Belum ada artikel yang dapat ditampilkan. Terbitkan lebih banyak artikel untuk mengisi bagian ini."}
      </div>
    </div>
  );

  return (
    <>
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {articles.length === 0
          ? renderEmptyState()
          : articles.map((article) => {
              const primaryCategory = article.categories[0] ?? null;
              const publishedLabel = formatPublishedLabel(article.publishedAt, article.createdAt);
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
                        width={article.featuredMedia?.width ?? 600}
                        height={article.featuredMedia?.height ?? 400}
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
                      <span aria-hidden className="transition group-hover:translate-x-1">→</span>
                    </span>
                  </div>
                </Link>
              );
            })}
      </div>
      {error ? (
        <p className="mt-6 text-center text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {hasMore ? (
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "rounded-full border-primary/50 px-8 text-sm font-semibold uppercase tracking-[0.3em] text-primary transition hover:border-primary hover:bg-primary/10",
            )}
            onClick={handleLoadMore}
            disabled={isLoading}
          >
            {isLoading ? "Memuat..." : "Tampilkan Selanjutnya"}
          </button>
        </div>
      ) : null}
    </>
  );
}

function formatPublishedLabel(publishedAt: string | null, createdAt: string) {
  const label = formatRelativeTime(publishedAt ?? createdAt);
  if (label) {
    return label;
  }
  try {
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(publishedAt ?? createdAt));
  } catch {
    return "-";
  }
}
