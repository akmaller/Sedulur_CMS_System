"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";

export type HeroSlideItem = {
  id: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  buttonLabel?: string | null;
  buttonUrl?: string | null;
  imageUrl?: string | null;
};

type HeroSliderProps = {
  slides: HeroSlideItem[];
  siteName: string;
  tagline?: string | null;
};

const AUTO_INTERVAL_MS = 7000;

function renderEmphasis(text: string, keyPrefix: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      const content = part.slice(2, -2);
      return (
        <span key={`${keyPrefix}-emphasis-${index}`} className="text-primary">
          {content}
        </span>
      );
    }
    return <span key={`${keyPrefix}-plain-${index}`}>{part}</span>;
  });
}

export function HeroSlider({ slides, siteName, tagline }: HeroSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [progressCycle, setProgressCycle] = useState(0);
  const safeSlides = useMemo(() => (slides.length === 0 ? [] : slides), [slides]);
  const slideCount = safeSlides.length;
  const activeSlide = safeSlides[activeIndex] ?? null;

  useEffect(() => {
    if (slideCount <= 1) {
      return;
    }

    const timer = window.setTimeout(() => {
      setActiveIndex((current) => {
        const nextIndex = current + 1 >= slideCount ? 0 : current + 1;
        return nextIndex;
      });
    }, AUTO_INTERVAL_MS);

    return () => window.clearTimeout(timer);
  }, [activeIndex, slideCount]);

  useEffect(() => {
    if (slideCount === 0) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      setProgressCycle((value) => value + 1);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeIndex, slideCount]);

  if (!activeSlide) {
    return (
      <div className="rounded-[32px] border border-border/40 bg-secondary/40 px-6 py-12 text-center sm:px-12">
        <p className="text-base text-muted-foreground">
          Tambahkan setidaknya satu slide hero dari dashboard untuk menampilkan highlight utama.
        </p>
      </div>
    );
  }

  const indicatorKey = `${progressCycle}-${activeIndex}`;
  const slideSubtitle = activeSlide.subtitle ?? tagline ?? "Personal Blog";
  const ctaUrl = activeSlide.buttonUrl ?? "/articles";
  const ctaLabel = activeSlide.buttonLabel ?? "Jelajahi Blog";

  const handlePrev = () => {
    setActiveIndex((current) => {
      if (slideCount === 0) return 0;
      return current === 0 ? slideCount - 1 : current - 1;
    });
  };

  const handleNext = () => {
    setActiveIndex((current) => {
      if (slideCount === 0) return 0;
      return current + 1 >= slideCount ? 0 : current + 1;
    });
  };

  const handleSelect = (index: number) => {
    setActiveIndex(index);
  };

  return (
    <section className="relative overflow-hidden rounded-[36px] border border-border/40 bg-[radial-gradient(circle_at_top,_hsla(218,_35%,_18%,_0.85),_hsla(218,_28%,_14%,_0.98))] px-6 py-12 shadow-[0_30px_70px_-30px_rgba(0,0,0,0.45)] sm:px-12 sm:py-16 lg:px-16">
      <div className="flex flex-col gap-12 lg:flex-row lg:items-center">
        <div className="flex-1 space-y-6">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-primary/90">
              {slideSubtitle}
            </span>
            <h1 className="font-display text-4xl leading-tight text-foreground sm:text-5xl lg:text-6xl">
              {renderEmphasis(activeSlide.title, "title")}
            </h1>
          </div>
          {activeSlide.description ? (
            <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
              {renderEmphasis(activeSlide.description, "description")}
            </p>
          ) : null}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={ctaUrl}
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-12 rounded-full bg-primary px-6 text-base font-semibold text-primary-foreground transition hover:bg-primary/90",
              )}
            >
              {ctaLabel}
            </Link>
            {slideCount > 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "lg" }),
                  "h-12 rounded-full border border-border/60 bg-transparent px-6 text-base font-semibold text-foreground transition hover:border-primary hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                )}
              >
                Slide Selanjutnya
              </button>
            ) : (
              <Link
                href="/articles"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "lg" }),
                  "h-12 rounded-full border border-border/60 bg-transparent px-6 text-base font-semibold text-foreground transition hover:border-primary hover:bg-primary/10 hover:text-primary",
                )}
              >
                Baca Artikel Terbaru
              </Link>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden flex-1 items-center gap-2 md:flex">
              <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-border/50">
                <div
                  key={indicatorKey}
                  className="hero-slider-progress-bar absolute inset-0 h-full rounded-full bg-primary/80"
                  style={{
                    animationDuration: `${AUTO_INTERVAL_MS}ms`,
                  }}
                />
              </div>
              <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                {activeIndex + 1}/{slideCount}
              </span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrev}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-border/60 bg-secondary/50 text-foreground transition hover:border-primary hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                aria-label="Slide sebelumnya"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-border/60 bg-secondary/50 text-foreground transition hover:border-primary hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                aria-label="Slide selanjutnya"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="mt-6 flex items-center gap-2">
            {safeSlides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => handleSelect(index)}
                className={cn(
                  "h-2.5 rounded-full transition-all duration-300",
                  index === activeIndex ? "w-9 bg-primary" : "w-2.5 bg-border/60 hover:bg-primary/70",
                )}
                aria-label={`Pilih slide ${index + 1}`}
                aria-current={index === activeIndex}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="relative w-full max-w-md rounded-[32px] border border-border/40 bg-secondary/30 p-6 shadow-[0_25px_60px_-25px_rgba(0,0,0,0.55)]">
            <div className="absolute inset-0 rounded-[32px] border border-primary/20 opacity-30" aria-hidden />
            {activeSlide.imageUrl ? (
              <Image
                key={`${activeSlide.id}-${activeIndex}`}
                src={activeSlide.imageUrl}
                alt={activeSlide.title || siteName}
                width={600}
                height={800}
                className="relative z-[1] aspect-[3/4] w-full rounded-[24px] object-cover object-center shadow-2xl shadow-black/40 transition duration-700"
                priority
              />
            ) : (
              <div className="relative z-[1] flex aspect-[3/4] w-full items-center justify-center rounded-[24px] bg-secondary/50 text-sm uppercase tracking-[0.35em] text-muted-foreground">
                {siteName}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
