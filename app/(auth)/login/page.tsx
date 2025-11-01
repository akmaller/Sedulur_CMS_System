import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/auth";
import { getSiteConfig } from "@/lib/site-config/server";
import { AuthLayout } from "@/components/auth/auth-layout";
import { ArrowLeft } from "lucide-react";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Masuk",
  description: "Masuk ke dashboard Sedulur Personal Blog.",
};

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const callbackUrl = typeof params?.callbackUrl === "string" ? params.callbackUrl : undefined;
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? null;

  if (params?.next) {
    redirect(params.next as string);
  }

  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  const config = await getSiteConfig();
  const hero = (
    <>
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
          Bangun <span className="text-primary">identitas personal</span> lewat cerita yang konsisten.
        </h1>
        <p className="text-base text-muted-foreground">
          Kelola artikel, hero slider, dan media tanpa kompleksitas CMS organisasi.
        </p>
      </div>
      <ul className="space-y-2 text-sm text-muted-foreground">
        <li className="flex items-start gap-2">
          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
          <span>Perbarui hero slider dan landing blog pribadi dalam hitungan detik.</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
          <span>Susun artikel dan halaman statis dengan editor rich text yang familier.</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
          <span>Keamanan tetap terjaga dengan 2FA dan pemblokiran IP otomatis.</span>
        </li>
      </ul>
      <div className="relative mx-auto mt-4 max-w-xs">
        <div className="absolute inset-0 rounded-full bg-primary/25 blur-2xl" aria-hidden />
        <Image
          src="/images/auth-illustration.svg"
          alt="Ilustrasi sedulur personal blog"
          width={360}
          height={310}
          priority
          className="relative mx-auto drop-shadow-xl"
        />
      </div>
    </>
  );

  return (
    <AuthLayout hero={hero}>
      <div className="space-y-6">
        <Card className="border border-border/60 bg-card/80 shadow-xl shadow-black/20">
          <CardHeader className="space-y-3 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle asChild>
                <h2 className="text-2xl font-semibold text-foreground">Hai, selamat datang kembali</h2>
              </CardTitle>
              <Link
                href="/"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition hover:border-primary/60 hover:text-primary"
                aria-label={`Kembali ke ${config.name}`}
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </div>
            <CardDescription>
              Masuk untuk melanjutkan pengelolaan konten dan branding {config.name}.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <Suspense fallback={<div className="text-sm text-muted-foreground">Memuat formulir...</div>}>
          <LoginForm
            callbackUrl={callbackUrl}
            turnstileSiteKey={turnstileSiteKey}
          />
        </Suspense>
        <div className="text-right text-sm">
          <Link href="/forgot-password" className="font-medium text-primary hover:text-primary/80">
            Lupa kata sandi?
          </Link>
        </div>
      </CardContent>
    </Card>
      </div>
    </AuthLayout>
  );
}
