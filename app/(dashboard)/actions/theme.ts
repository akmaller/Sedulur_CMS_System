"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UserTheme } from "@prisma/client";

type ThemeUpdateResult =
  | { success: true }
  | { success: false; message?: string };

const allowedThemes = new Set<UserTheme>([UserTheme.LIGHT, UserTheme.DARK]);

export async function setThemePreference(theme: string): Promise<ThemeUpdateResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, message: "Anda perlu masuk untuk mengatur tema." };
  }

  const normalized = theme?.toUpperCase() ?? "";
  if (!allowedThemes.has(normalized as UserTheme)) {
    return { success: false, message: "Tema tidak dikenal." };
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { theme: normalized as UserTheme },
    });
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Failed to update theme preference", error);
    return { success: false, message: "Gagal menyimpan preferensi tema." };
  }
}
