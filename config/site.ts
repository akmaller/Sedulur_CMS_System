export type SiteConfig = {
  name: string;
  description: string;
  tagline?: string;
  logoUrl?: string;
  iconUrl?: string;
  contactEmail?: string;
  url: string;
  ogImage: string;
  links: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
  };
  metadata?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  comments?: {
    enabled?: boolean;
  };
  registration?: {
    enabled?: boolean;
    autoApprove?: boolean;
    privacyPolicyPageSlug?: string | null;
  };
  analytics?: {
    googleTagManagerId?: string | null;
  };
};

export const siteConfig: SiteConfig = {
  name: "Sedulur Personal Blog",
  description:
    "Catatan perjalanan karier, strategi pemasaran, dan insight kreatif yang dirangkum secara personal.",
  tagline: "Marketing. Strategy. Humanity.",
  logoUrl: "/branding/logo-mark.svg",
  iconUrl: "/default-favicon.ico",
  contactEmail: "hello@sedulur.blog",
  url: "https://sedulur.blog",
  ogImage: "/branding/og-default.svg",
  links: {
    facebook: "https://facebook.com/sedulur",
    instagram: "https://instagram.com/sedulur",
    youtube: "https://youtube.com/@sedulur",
    twitter: "https://twitter.com/sedulur",
  },
  metadata: {
    title: "Sedulur Personal Blog",
    description:
      "Artikel mendalam seputar marketing, strategi, dan pengembangan karier kreatif.",
    keywords: ["sedulur", "blog pribadi", "marketing", "strategi", "humanity"],
  },
  comments: {
    enabled: false,
  },
  registration: {
    enabled: false,
    autoApprove: false,
  },
  analytics: {
    googleTagManagerId: null,
  },
};
