"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
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
  const [scrollProgress, setScrollProgress] = useState(0);
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
    const handleScroll = () => {
      const viewportHeight = window.innerHeight || 1;
      const rawProgress = window.scrollY / viewportHeight;
      const clamped = Math.min(Math.max(rawProgress, 0), 1);
      setScrollProgress(clamped);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!activeSlide) {
    return (
      <section className="fixed inset-0 z-0 flex h-screen w-full items-center justify-center bg-[radial-gradient(circle_at_top,_hsla(218,_35%,_18%,_0.65),_hsla(218,_28%,_14%,_0.95))] px-4 text-center text-muted-foreground sm:px-8">
        <div className="max-w-xl">
          <p className="text-base">
            Tambahkan setidaknya satu slide hero dari dashboard untuk menampilkan highlight utama.
          </p>
        </div>
      </section>
    );
  }

  const slideSubtitle = activeSlide.subtitle ?? tagline ?? "Personal Blog";
  const opacity = Math.max(0, 1 - scrollProgress * 1.2);
  const translateY = scrollProgress * -60;
  const sliderStyle: CSSProperties = {
    opacity,
    transform: `translateY(${translateY}px)`,
    pointerEvents: scrollProgress > 0.9 ? "none" : "auto",
  };

  return (
    <section
      className="fixed inset-0 z-0 flex h-screen w-full overflow-hidden bg-[radial-gradient(circle_at_top,_hsla(218,_35%,_18%,_0.85),_hsla(218,_28%,_14%,_0.98))]"
      style={sliderStyle}
    >
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-background/10 via-transparent to-transparent" aria-hidden />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pb-24 pt-16 sm:px-6 md:flex-row md:items-center md:gap-12 md:px-8 md:pt-14 lg:gap-16 lg:px-12 lg:pt-20">
        <div className="hidden flex-1 md:block">
          <div className="relative min-h-[280px] space-y-5 md:min-h-[340px]">
            {safeSlides.map((slide, index) => {
              const isActive = index === activeIndex;
              const subtitle = slide.subtitle ?? slideSubtitle;
              const description = slide.description ?? activeSlide.description;
              const descriptionContent = description
                ? renderEmphasis(description, `description-${slide.id}`)
                : null;

              return (
                <article
                  key={slide.id}
                  className={cn(
                    "absolute inset-0 flex flex-col gap-6 transition-opacity duration-1000 ease-out",
                    isActive ? "opacity-100" : "pointer-events-none opacity-0",
                  )}
                  aria-hidden={!isActive}
                >
                  <div className="space-y-3">
                    <span className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.35em] text-primary/90 sm:text-xs">
                      {subtitle}
                    </span>
                    <h1 className="font-display text-4xl leading-tight text-foreground sm:text-5xl lg:text-6xl">
                      {renderEmphasis(slide.title, `title-${slide.id}`)}
                    </h1>
                  </div>
                  {descriptionContent ? (
                    <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
                      {descriptionContent}
                    </p>
                  ) : null}
                </article>
              );
            })}
          </div>
        </div>

        <div className="flex flex-1 items-end justify-center md:order-2 md:justify-end">
          <div className="relative w-full max-w-md md:max-w-lg lg:max-w-xl">
            <div
              className="absolute inset-0 -z-10 rounded-full bg-primary/20 blur-[140px] opacity-50"
              aria-hidden
            />
            <div className="relative w-full overflow-hidden rounded-3xl md:rounded-[2.5rem] min-h-screen md:min-h-0 md:h-full md:aspect-[3/4]">
              {safeSlides.map((slide, index) => {
                const isActive = index === activeIndex;
                const subtitle = slide.subtitle ?? slideSubtitle;
                const description = slide.description ?? activeSlide.description;
                const descriptionContent = description
                  ? renderEmphasis(description, `mobile-description-${slide.id}`)
                  : null;
                return (
                  <div
                    key={slide.id}
                    className={cn(
                      "absolute inset-0 transition-opacity duration-1000 ease-out",
                      isActive ? "opacity-100" : "pointer-events-none opacity-0",
                    )}
                    aria-hidden={!isActive}
                  >
                    {slide.imageUrl ? (
                      <Image
                        src={slide.imageUrl}
                        alt={slide.title || siteName}
                        fill
                        priority={isActive}
                        sizes="100vw"
                        className="h-full w-full object-contain md:object-cover"
                        style={{ objectPosition: "top center" }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center rounded-3xl bg-secondary/40 text-sm uppercase tracking-[0.35em] text-muted-foreground">
                        {siteName}
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-16 flex justify-center px-2 md:hidden">
                      <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-background/70 px-5 py-5 text-white shadow-lg backdrop-blur-xl">
                        <div className="flex flex-col gap-4">
                          <div className="space-y-3">
                            <span className="inline-flex items-center gap-2 rounded-full bg-primary/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-primary/90">
                              {subtitle}
                            </span>
                            <h2 className="font-display text-3xl leading-tight sm:text-4xl">
                              {renderEmphasis(slide.title, `mobile-title-${slide.id}`)}
                            </h2>
                          </div>
                          {descriptionContent ? (
                            <p className="text-sm text-white/80">{descriptionContent}</p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
