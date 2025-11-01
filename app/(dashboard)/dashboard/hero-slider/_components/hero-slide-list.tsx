"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil, Trash } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  deleteHeroSlideAction,
  moveHeroSlideAction,
  toggleHeroSlideActiveAction,
} from "../actions";

type HeroSlideListItem = {
  id: string;
  title: string;
  subtitle: string | null;
  order: number;
  isActive: boolean;
  buttonLabel: string | null;
  imageUrl: string | null;
  updatedAt: string;
};

type HeroSlideListProps = {
  slides: HeroSlideListItem[];
};

export function HeroSlideList({ slides }: HeroSlideListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeAction, setActiveAction] = useState<{ id: string; action: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runAction = (id: string, action: string, operation: () => Promise<unknown>) => {
    setError(null);
    setActiveAction({ id, action });
    startTransition(() => {
      operation()
        .catch((err) => {
          setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
        })
        .finally(() => {
          setActiveAction(null);
          router.refresh();
        });
    });
  };

  const handleToggle = (slide: HeroSlideListItem) => {
    runAction(slide.id, "toggle", () => toggleHeroSlideActiveAction(slide.id, !slide.isActive));
  };

  const handleMove = (slide: HeroSlideListItem, direction: "up" | "down") => {
    runAction(slide.id, direction, () => moveHeroSlideAction(slide.id, direction));
  };

  const handleDelete = (slide: HeroSlideListItem) => {
    if (!window.confirm(`Hapus slide "${slide.title}"?`)) {
      return;
    }
    runAction(slide.id, "delete", async () => {
      const result = await deleteHeroSlideAction(slide.id);
      if (!result.success) {
        setError(result.error ?? "Gagal menghapus slide.");
      }
    });
  };

  if (slides.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Belum ada slide</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Tambahkan slide pertama Anda untuk menampilkan hero di halaman publik.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="grid gap-4">
        {slides.map((slide, index) => {
          const isProcessing = isPending && activeAction?.id === slide.id;
          return (
            <Card key={slide.id} className="border-border/60 bg-card/50">
              <CardContent className="flex flex-col gap-6 p-6 lg:flex-row">
                <div className="relative h-40 w-full overflow-hidden rounded-2xl border border-border/60 bg-secondary/40 lg:h-32 lg:w-56">
                  {slide.imageUrl ? (
                    <Image
                      src={slide.imageUrl}
                      alt={slide.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-[0.3em] text-muted-foreground">
                      Tanpa Gambar
                    </div>
                  )}
                  <Badge variant="outline" className="absolute left-3 top-3 bg-background/70">
                    #{slide.order}
                  </Badge>
                </div>

                <div className="flex flex-1 flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="font-semibold text-foreground lg:text-lg">{slide.title}</h3>
                    <Badge variant={slide.isActive ? "default" : "secondary"}>
                      {slide.isActive ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </div>
                  {slide.subtitle ? (
                    <p className="text-sm text-muted-foreground">{slide.subtitle}</p>
                  ) : null}
                  {slide.buttonLabel ? (
                    <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground/80">
                      Tombol: {slide.buttonLabel}
                    </p>
                  ) : null}
                  <p className="text-xs text-muted-foreground">
                    Diperbarui {new Date(slide.updatedAt).toLocaleString("id-ID")}
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggle(slide)}
                    disabled={isProcessing}
                    className="w-full justify-start sm:w-auto"
                  >
                    {slide.isActive ? (
                      <>
                        <EyeOff className="mr-2 h-4 w-4" /> Sembunyikan
                      </>
                    ) : (
                      <>
                        <Eye className="mr-2 h-4 w-4" /> Tampilkan
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMove(slide, "up")}
                    disabled={isProcessing || index === 0}
                    className="w-full justify-start sm:w-auto"
                  >
                    <ArrowUp className="mr-2 h-4 w-4" /> Naik
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMove(slide, "down")}
                    disabled={isProcessing || index === slides.length - 1}
                    className="w-full justify-start sm:w-auto"
                  >
                    <ArrowDown className="mr-2 h-4 w-4" /> Turun
                  </Button>
                  <Link href={`/dashboard/hero-slider/${slide.id}`} className="w-full sm:w-auto">
                    <Button variant="outline" size="sm" className="w-full">
                      <Pencil className="mr-2 h-4 w-4" /> Ubah
                    </Button>
                  </Link>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(slide)}
                    disabled={isProcessing}
                    className="w-full sm:w-auto"
                  >
                    <Trash className="mr-2 h-4 w-4" /> Hapus
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
