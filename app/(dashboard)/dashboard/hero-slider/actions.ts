"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { assertRole } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit/log";

const heroSlideFormSchema = z.object({
  title: z.string().trim().min(8, "Judul minimal 8 karakter."),
  subtitle: z.string().trim().max(160).optional().nullable(),
  description: z.string().trim().max(600).optional().nullable(),
  buttonLabel: z.string().trim().max(80).optional().nullable(),
  buttonUrl: z
    .string()
    .trim()
    .url({ message: "URL tombol tidak valid." })
    .optional()
    .nullable(),
  imageId: z.string().cuid().optional().nullable(),
  imageUrl: z
    .string()
    .trim()
    .url({ message: "URL gambar tidak valid." })
    .optional()
    .nullable(),
  isActive: z.boolean().default(true),
});

export type HeroSlideFormState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Partial<Record<keyof z.infer<typeof heroSlideFormSchema>, string>>;
};

function parseHeroSlideForm(formData: FormData) {
  const raw = {
    title: (formData.get("title") ?? "").toString(),
    subtitle: formData.get("subtitle")?.toString().trim() || null,
    description: formData.get("description")?.toString().trim() || null,
    buttonLabel: formData.get("buttonLabel")?.toString().trim() || null,
    buttonUrl: formData.get("buttonUrl")?.toString().trim() || null,
    imageId: formData.get("imageId")?.toString().trim() || null,
    imageUrl: formData.get("imageUrl")?.toString().trim() || null,
    isActive: formData.get("isActive") === "on" || formData.get("isActive") === "true",
  } satisfies Record<string, string | boolean | null>;

  return heroSlideFormSchema.safeParse({
    title: raw.title,
    subtitle: raw.subtitle,
    description: raw.description,
    buttonLabel: raw.buttonLabel,
    buttonUrl: raw.buttonUrl ? raw.buttonUrl : null,
    imageId: raw.imageId ? raw.imageId : null,
    imageUrl: raw.imageUrl ? raw.imageUrl : null,
    isActive: raw.isActive,
  });
}

function toFieldErrors(error: z.ZodError): HeroSlideFormState["fieldErrors"] {
  const fieldErrors: HeroSlideFormState["fieldErrors"] = {};
  for (const issue of error.issues) {
    if (issue.path.length > 0) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors?.[key as keyof HeroSlideFormState["fieldErrors"]]) {
        fieldErrors![key as keyof HeroSlideFormState["fieldErrors"]] = issue.message;
      }
    }
  }
  return fieldErrors;
}

async function resolveImageReference(imageId: string | null, explicitUrl: string | null) {
  if (!imageId) {
    return {
      imageId: null,
      imageUrl: explicitUrl,
    } as const;
  }

  const media = await prisma.media.findUnique({ where: { id: imageId }, select: { id: true, url: true } });
  if (!media) {
    throw new Error("Media gambar tidak ditemukan.");
  }

  return {
    imageId: media.id,
    imageUrl: media.url,
  } as const;
}

async function revalidateHeroSliderCache() {
  revalidatePath("/");
  revalidatePath("/dashboard/hero-slider");
}

export async function createHeroSlideAction(
  _prevState: HeroSlideFormState | undefined,
  formData: FormData,
): Promise<HeroSlideFormState> {
  const parseResult = parseHeroSlideForm(formData);
  if (!parseResult.success) {
    return { error: "Periksa kembali data yang diisi.", fieldErrors: toFieldErrors(parseResult.error) };
  }

  const session = await assertRole(["ADMIN", "EDITOR"]);
  try {
    const payload = parseResult.data;
    const { imageId, imageUrl } = await resolveImageReference(payload.imageId ?? null, payload.imageUrl ?? null);

    const maxOrder = await prisma.heroSlide.aggregate({ _max: { order: true } });
    const nextOrder = (maxOrder._max.order ?? 0) + 1;

    const created = await prisma.heroSlide.create({
      data: {
        title: payload.title,
        subtitle: payload.subtitle ?? null,
        description: payload.description ?? null,
        buttonLabel: payload.buttonLabel ?? null,
        buttonUrl: payload.buttonUrl ?? null,
        imageId,
        imageUrl: imageUrl ?? null,
        order: nextOrder,
        isActive: payload.isActive,
      },
    });

    await writeAuditLog({
      action: "CREATE",
      entity: "HeroSlide",
      entityId: created.id,
      userId: session.user.id,
      metadata: {
        title: created.title,
      },
    });

    revalidateHeroSliderCache();
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Gagal menyimpan slide.",
    };
  }
}

export async function updateHeroSlideAction(
  heroSlideId: string,
  _prevState: HeroSlideFormState | undefined,
  formData: FormData,
): Promise<HeroSlideFormState> {
  const parseResult = parseHeroSlideForm(formData);
  if (!parseResult.success) {
    return { error: "Periksa kembali data yang diisi.", fieldErrors: toFieldErrors(parseResult.error) };
  }

  const session = await assertRole(["ADMIN", "EDITOR"]);
  try {
    const existing = await prisma.heroSlide.findUnique({ where: { id: heroSlideId } });
    if (!existing) {
      return { error: "Slide tidak ditemukan." };
    }

    const payload = parseResult.data;
    const { imageId, imageUrl } = await resolveImageReference(payload.imageId ?? null, payload.imageUrl ?? existing.imageUrl);

    await prisma.heroSlide.update({
      where: { id: heroSlideId },
      data: {
        title: payload.title,
        subtitle: payload.subtitle ?? null,
        description: payload.description ?? null,
        buttonLabel: payload.buttonLabel ?? null,
        buttonUrl: payload.buttonUrl ?? null,
        imageId,
        imageUrl: imageUrl ?? null,
        isActive: payload.isActive,
      },
    });

    await writeAuditLog({
      action: "UPDATE",
      entity: "HeroSlide",
      entityId: heroSlideId,
      userId: session.user.id,
      metadata: {
        title: payload.title,
      },
    });

    revalidateHeroSliderCache();
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Gagal memperbarui slide.",
    };
  }
}

export async function deleteHeroSlideAction(heroSlideId: string): Promise<{ success: boolean; error?: string }> {
  await assertRole(["ADMIN", "EDITOR"]);
  try {
    await prisma.heroSlide.delete({ where: { id: heroSlideId } });
    revalidateHeroSliderCache();
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Gagal menghapus slide." };
  }
}

export async function toggleHeroSlideActiveAction(heroSlideId: string, isActive: boolean) {
  await assertRole(["ADMIN", "EDITOR"]);
  await prisma.heroSlide.update({ where: { id: heroSlideId }, data: { isActive } });
  revalidateHeroSliderCache();
}

export async function moveHeroSlideAction(heroSlideId: string, direction: "up" | "down") {
  await assertRole(["ADMIN", "EDITOR"]);
  const current = await prisma.heroSlide.findUnique({ where: { id: heroSlideId } });
  if (!current) {
    throw new Error("Slide tidak ditemukan.");
  }

  const neighbor = await prisma.heroSlide.findFirst({
    where: direction === "up" ? { order: { lt: current.order } } : { order: { gt: current.order } },
    orderBy: { order: direction === "up" ? "desc" : "asc" },
  });

  if (!neighbor) {
    return;
  }

  await prisma.$transaction([
    prisma.heroSlide.update({ where: { id: current.id }, data: { order: neighbor.order } }),
    prisma.heroSlide.update({ where: { id: neighbor.id }, data: { order: current.order } }),
  ]);

  revalidateHeroSliderCache();
}
