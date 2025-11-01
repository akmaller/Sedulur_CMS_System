import Link from "next/link";
import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";

import { getSiteConfig } from "@/lib/site-config/server";
import { getMenuTree } from "@/lib/menu/server";
import { resolveMenuHref, type MenuNode } from "@/lib/menu/utils";
import { ResponsiveLogoImage } from "./site-logo";

function extractFlatLinks(menu: MenuNode[], limit = 6) {
  const links: { id: string; title: string; href: string }[] = [];
  for (const item of menu) {
    if (links.length >= limit) break;
    if (item.children.length > 0) {
      links.push(...item.children.map((child) => ({
        id: child.id,
        title: child.title,
        href: resolveMenuHref(child.slug, child.url),
      })));
    } else {
      links.push({ id: item.id, title: item.title, href: resolveMenuHref(item.slug, item.url) });
    }
  }
  return links.slice(0, limit);
}

function getSocialEntries(links: Record<string, string | undefined | null>) {
  return [
    { key: "facebook", icon: Facebook, label: "Facebook", href: links.facebook },
    { key: "instagram", icon: Instagram, label: "Instagram", href: links.instagram },
    { key: "twitter", icon: Twitter, label: "Twitter", href: links.twitter },
    { key: "youtube", icon: Youtube, label: "YouTube", href: links.youtube },
  ].filter((entry) => Boolean(entry.href)) as Array<{
    key: string;
    icon: typeof Facebook;
    label: string;
    href: string;
  }>;
}

function obfuscateEmail(value: string) {
  return value
    .split("")
    .map((char) => `&#${char.charCodeAt(0)};`)
    .join("");
}

export async function SiteFooter() {
  const [config, footerMenu, mainMenu] = await Promise.all([
    getSiteConfig(),
    getMenuTree("footer"),
    getMenuTree("main"),
  ]);

  const primaryLinks = extractFlatLinks(mainMenu, 6);
  const secondaryLinks = extractFlatLinks(footerMenu, 6);
  const socialEntries = getSocialEntries(config.links ?? {});
  const obfuscatedEmail = config.contactEmail ? obfuscateEmail(config.contactEmail) : null;

  return (
    <footer className="border-t border-border/40 bg-background/85 backdrop-blur">
      <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-16">
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-4 text-foreground">
              {config.logoUrl ? (
                <ResponsiveLogoImage
                  src={config.logoUrl}
                  alt={config.name}
                  maxHeight={54}
                  maxWidth={260}
                />
              ) : (
                <div className="flex flex-col">
                  <span className="text-lg font-semibold uppercase tracking-[0.35em] text-primary">
                    {config.name}
                  </span>
                  {config.tagline ? (
                    <span className="text-xs uppercase tracking-[0.4em] text-muted-foreground">
                      {config.tagline}
                    </span>
                  ) : null}
                </div>
              )}
            </Link>
            <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
              {config.description}
            </p>
            {socialEntries.length > 0 ? (
              <div className="flex flex-wrap items-center gap-3">
                {socialEntries.map(({ key, icon: Icon, label, href }) => (
                  <a
                    key={key}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/70 text-muted-foreground transition hover:border-primary/60 hover:text-primary"
                    aria-label={label}
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            ) : null}
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-muted-foreground">
                Navigasi
              </p>
              <ul className="space-y-2 text-sm text-foreground/90">
                {primaryLinks.map((link) => (
                  <li key={link.id}>
                    <Link
                      href={link.href === "#" ? "/" : link.href}
                      className="transition hover:text-primary"
                    >
                      {link.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-muted-foreground">
                Informasi
              </p>
              <ul className="space-y-2 text-sm text-foreground/90">
                {secondaryLinks.map((link) => (
                  <li key={link.id}>
                    <Link
                      href={link.href === "#" ? "/" : link.href}
                      className="transition hover:text-primary"
                    >
                      {link.title}
                    </Link>
                  </li>
                ))}
                {obfuscatedEmail ? (
                  <li>
                    <a
                      href={`mailto:${obfuscatedEmail}`}
                      className="transition hover:text-primary"
                    >
                      {config.contactEmail}
                    </a>
                  </li>
                ) : null}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {new Date().getFullYear()} {config.name}. Semua hak cipta dilindungi.
          </p>
          {config.tagline ? (
            <p className="uppercase tracking-[0.3em] text-muted-foreground/80">
              {config.tagline}
            </p>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
