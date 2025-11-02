import { Prisma } from "@prisma/client";

export const publicArticleInclude = {
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
    orderBy: { assignedAt: "asc" as const },
  },
} satisfies Prisma.ArticleInclude;

export type PublicArticleEntity = Prisma.ArticleGetPayload<{ include: typeof publicArticleInclude }>;

export type PublicArticle = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  publishedAt: string | null;
  createdAt: string;
  categories: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  featuredMedia: {
    url: string | null;
    title: string | null;
    width: number | null;
    height: number | null;
  } | null;
};

export function serializePublicArticle(article: PublicArticleEntity): PublicArticle {
  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt ?? null,
    publishedAt: article.publishedAt ? article.publishedAt.toISOString() : null,
    createdAt: article.createdAt.toISOString(),
    categories: article.categories.map(({ category }) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
    })),
    featuredMedia: article.featuredMedia
      ? {
          url: article.featuredMedia.url ?? null,
          title: article.featuredMedia.title ?? null,
          width: article.featuredMedia.width ?? null,
          height: article.featuredMedia.height ?? null,
        }
      : null,
  };
}
