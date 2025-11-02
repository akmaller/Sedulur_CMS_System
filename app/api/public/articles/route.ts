import { NextResponse } from "next/server";
import { ArticleStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { publicArticleInclude, serializePublicArticle } from "@/lib/articles/public";

const DEFAULT_TAKE = 9;
const MAX_TAKE = 30;

function parsePositiveInteger(value: string | null, fallback: number): number {
  if (!value) {
    return fallback;
  }
  const numeric = Number.parseInt(value, 10);
  if (Number.isNaN(numeric) || numeric < 0) {
    return fallback;
  }
  return numeric;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const skipRaw = searchParams.get("skip");
  const takeRaw = searchParams.get("take");

  const skip = Math.max(0, parsePositiveInteger(skipRaw, 0));
  const take = Math.min(MAX_TAKE, Math.max(1, parsePositiveInteger(takeRaw, DEFAULT_TAKE)));

  const articles = await prisma.article.findMany({
    where: { status: ArticleStatus.PUBLISHED },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    skip,
    take,
    include: publicArticleInclude,
  });

  return NextResponse.json({
    articles: articles.map(serializePublicArticle),
  });
}
