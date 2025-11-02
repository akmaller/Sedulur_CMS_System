import Link from "next/link";
import { Facebook, Instagram, Menu, Search, Twitter, Youtube } from "lucide-react";
import { Suspense, type ComponentType } from "react";

import { getSiteConfig } from "@/lib/site-config/server";
import { getMenuTree } from "@/lib/menu/server";
import { resolveMenuHref } from "@/lib/menu/utils";
import { MobileNavigation } from "./site-header-mobile";
import { ResponsiveLogoImage } from "./site-logo";

export async function SiteHeader() {
  const [config, mainMenu] = await Promise.all([getSiteConfig(), getMenuTree("main")]);

  const socialLinks = [
    config.links.facebook
      ? { key: "facebook", href: config.links.facebook, label: "Facebook", icon: Facebook }
      : null,
    config.links.instagram
      ? { key: "instagram", href: config.links.instagram, label: "Instagram", icon: Instagram }
      : null,
    config.links.twitter
      ? { key: "twitter", href: config.links.twitter, label: "Twitter", icon: Twitter }
      : null,
    config.links.youtube
      ? { key: "youtube", href: config.links.youtube, label: "YouTube", icon: Youtube }
      : null,
  ].filter(Boolean) as Array<{
    key: string;
    href: string;
    label: string;
    icon: ComponentType<{ className?: string }>;
  }>;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/75 backdrop-blur-xl">
      <div className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          {config.logoUrl ? (
            <ResponsiveLogoImage
              src={config.logoUrl}
              alt={config.name}
              maxHeight={48}
              maxWidth={240}
              priority
            />
          ) : null}
          {!config.logoUrl ? (
            <div className="flex flex-col leading-tight">
              <span className="text-lg font-semibold uppercase tracking-[0.35em] text-primary">
                {config.name}
              </span>
              {config.tagline ? (
                <span className="text-xs uppercase tracking-[0.45em] text-muted-foreground">
                  {config.tagline}
                </span>
              ) : null}
            </div>
          ) : null}
        </Link>
        <nav
          className="hidden items-center gap-3 text-xs font-semibold uppercase tracking-[0.1em] md:flex"
          aria-label="Navigasi utama"
        >
          {mainMenu.map((item) => {
            const href = resolveMenuHref(item.slug, item.url);
            const disabled = href === "#";
            if (item.children.length > 0) {
              return (
                <div key={item.id} className="relative group">
                  {disabled ? (
                    <span className="inline-flex items-center rounded-full px-4 py-2 text-muted-foreground/70">
                      {item.title}
                    </span>
                  ) : (
                    <Link
                      href={href}
                      className="inline-flex items-center rounded-full px-4 py-2 text-foreground transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                      {item.title}
                    </Link>
                  )}
                  <div className="pointer-events-none absolute left-0 top-full z-40 w-56 -translate-y-2 rounded-xl border border-border/70 bg-card/95 p-2 opacity-0 shadow-lg ring-1 ring-primary/10 transition duration-200 ease-out group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100 before:absolute before:-top-3 before:left-0 before:h-3 before:w-full before:content-['']">
                    <ul className="space-y-1 py-1 text-sm">
                      {item.children.map((child) => {
                        const childHref = resolveMenuHref(child.slug, child.url);
                        return (
                          <li key={child.id}>
                            <Link
                              href={childHref}
                              className="block rounded-md px-3 py-2 text-foreground transition hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                            >
                              {child.title}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              );
            }

            return disabled ? (
              <span
                key={item.id}
                className="inline-flex items-center rounded-full px-4 py-2 text-muted-foreground/70"
              >
                {item.title}
              </span>
            ) : (
              <Link
                key={item.id}
                href={href}
                className="inline-flex items-center rounded-full px-4 py-2 text-foreground transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                {item.title}
              </Link>
            );
          })}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/search"
            className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-foreground transition hover:border-primary/60 hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            aria-label="Cari artikel"
          >
            <Search className="h-4 w-4" />
            <span>Cari</span>
          </Link>
          {socialLinks.length > 0 ? (
            <div className="flex items-center gap-2">
              {socialLinks.map(({ key, href, label, icon: Icon }) => (
                <a
                  key={key}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/70 text-muted-foreground transition hover:border-primary/60 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  aria-label={label}
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-card/50 text-foreground transition hover:border-primary/60 hover:text-primary"
            data-sidebar-trigger
            aria-label="Buka menu navigasi"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
      <Suspense fallback={null}>
        <MobileNavigation siteConfig={config} mainMenu={mainMenu} />
      </Suspense>
    </header>
  );
}
