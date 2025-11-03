import { unstable_cache } from "next/cache";

import { prisma } from "@/lib/prisma";
import { siteConfig as defaultSiteConfig } from "@/config/site";
import type { ConfigValues } from "@/components/forms/config-form";
import type { ResolvedSiteConfig } from "./types";

const trimOrNull = (value: unknown) => {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const mergeConfig = (values?: ConfigValues | null): ResolvedSiteConfig => {
  const metadata = values?.metadata ?? {};
  const social = values?.social ?? {};

  const resolveSocialLink = (key: keyof typeof defaultSiteConfig.links): string | undefined => {
    const hasCustomValue = social && Object.prototype.hasOwnProperty.call(social, key);
    if (hasCustomValue) {
      const raw = (social as Record<string, unknown>)[key];
      return trimOrNull(raw) ?? undefined;
    }
    return trimOrNull(defaultSiteConfig.links[key]) ?? undefined;
  };

  const registrationDefaults = defaultSiteConfig.registration ?? { enabled: true, autoApprove: false };
  const registrationSetting = values?.registration ?? {};
  const analyticsDefaults = defaultSiteConfig.analytics ?? {};
  const analyticsSetting = values?.analytics ?? {};
  const commentsDefaults = defaultSiteConfig.comments ?? { enabled: true };
  const commentsSetting = values?.comments ?? {};
  const normalizePolicySlug = (value: unknown) =>
    typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
  const privacyPolicyPageSlug =
    normalizePolicySlug(registrationSetting.privacyPolicyPageSlug) ??
    normalizePolicySlug(registrationDefaults.privacyPolicyPageSlug);

  const resolvedLogoUrl = trimOrNull(values?.logoUrl) ?? defaultSiteConfig.logoUrl;
  const resolvedIconUrl = trimOrNull(values?.iconUrl) ?? defaultSiteConfig.iconUrl;
  const resolvedSiteUrl = trimOrNull(values?.siteUrl) ?? defaultSiteConfig.url;
  const resolvedContactEmail = trimOrNull(values?.contactEmail) ?? defaultSiteConfig.contactEmail;
  const resolvedOgImage = trimOrNull(defaultSiteConfig.ogImage) ?? defaultSiteConfig.ogImage;
  const resolvedGoogleTagManagerId =
    trimOrNull(analyticsSetting.googleTagManagerId) ??
    trimOrNull(analyticsDefaults.googleTagManagerId) ??
    null;

  return {
    ...defaultSiteConfig,
    name: values?.siteName?.trim() || defaultSiteConfig.name,
    description:
      metadata.description?.trim() || values?.tagline?.trim() || defaultSiteConfig.description,
    tagline: values?.tagline?.trim() || defaultSiteConfig.tagline,
    logoUrl: resolvedLogoUrl,
    iconUrl: resolvedIconUrl,
    contactEmail: resolvedContactEmail,
    links: {
      facebook: resolveSocialLink("facebook"),
      instagram: resolveSocialLink("instagram"),
      twitter: resolveSocialLink("twitter"),
      youtube: resolveSocialLink("youtube"),
    },
    metadata: {
      title: metadata.title?.trim() || defaultSiteConfig.metadata?.title || defaultSiteConfig.name,
      description:
        metadata.description?.trim() || defaultSiteConfig.metadata?.description || defaultSiteConfig.description,
      keywords:
        Array.isArray(metadata.keywords) && metadata.keywords.length > 0
          ? metadata.keywords
              .map((keyword) => (typeof keyword === "string" ? keyword.trim() : ""))
              .filter((keyword) => Boolean(keyword && keyword.length > 0))
          : defaultSiteConfig.metadata?.keywords ?? [],
    },
    ogImage: resolvedOgImage,
    url: resolvedSiteUrl,
    registration: {
      enabled:
        registrationSetting.enabled ?? registrationDefaults.enabled ?? true,
      autoApprove:
        registrationSetting.autoApprove ?? registrationDefaults.autoApprove ?? false,
      privacyPolicyPageSlug,
    },
    comments: {
      enabled: commentsSetting.enabled ?? commentsDefaults.enabled ?? true,
    },
    analytics: {
      googleTagManagerId: resolvedGoogleTagManagerId,
    },
  };
};

const fetchSiteConfig = async () => {
  const record = await prisma.siteConfig.findUnique({ where: { key: "general" } });
  const value = (record?.value ?? null) as ConfigValues | null;
  return mergeConfig(value);
};

export const getSiteConfig = unstable_cache(fetchSiteConfig, ["site-config"], {
  tags: ["site-config"],
});
