"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FeaturedImagePicker, type SelectedMedia } from "@/components/media/featured-image-picker";
import type { MediaItem } from "@/components/media/media-grid";
import type { HeroSlideFormState } from "../actions";

export type HeroSlideFormValues = {
  title: string;
  subtitle?: string | null;
  description?: string | null;
  buttonLabel?: string | null;
  buttonUrl?: string | null;
  imageId?: string | null;
  imageUrl?: string | null;
  isActive?: boolean | null;
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="min-w-[8rem]" disabled={pending}>
      {pending ? "Menyimpan..." : label}
    </Button>
  );
}

type HeroSlideFormProps = {
  action: (state: HeroSlideFormState | undefined, formData: FormData) => Promise<HeroSlideFormState>;
  initialValues?: HeroSlideFormValues;
  mediaItems: MediaItem[];
  submitLabel?: string;
};

export function HeroSlideForm({ action, initialValues, mediaItems, submitLabel = "Simpan Slide" }: HeroSlideFormProps) {
  const router = useRouter();
  const [state, formAction] = useActionState<HeroSlideFormState, FormData>(action, {});
  const initialSelectedMedia = useMemo<SelectedMedia | null>(() => {
    if (!initialValues?.imageId) {
      return null;
    }
    const match = mediaItems.find((item) => item.id === initialValues.imageId);
    if (!match) {
      return null;
    }
    return {
      id: match.id,
      title: match.title,
      url: match.url,
      description: match.description ?? null,
      mimeType: match.mimeType,
      createdAt: typeof match.createdAt === "string" ? match.createdAt : match.createdAt.toISOString(),
    } satisfies SelectedMedia;
  }, [initialValues, mediaItems]);

  const [selectedMedia, setSelectedMedia] = useState<SelectedMedia | null>(initialSelectedMedia);
  const [manualImageUrl, setManualImageUrl] = useState(initialValues?.imageUrl ?? "");
  const [isActive, setIsActive] = useState(initialValues?.isActive ?? true);

  useEffect(() => {
    if (state?.success) {
      router.push("/dashboard/hero-slider");
      router.refresh();
    }
  }, [state?.success, router]);

  const handleSelectMedia = (media: SelectedMedia | null) => {
    setSelectedMedia(media);
    if (media) {
      setManualImageUrl(media.url);
    }
  };

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Judul Slide</Label>
            <Input
              id="title"
              name="title"
              defaultValue={initialValues?.title ?? ""}
              placeholder="Contoh: Globally-recognized marketing and social media keynote speaker"
              required
              aria-describedby={state?.fieldErrors?.title ? "title-error" : undefined}
            />
            {state?.fieldErrors?.title ? (
              <p id="title-error" className="text-sm text-destructive">
                {state.fieldErrors.title}
              </p>
            ) : null}
            <p className="text-sm text-muted-foreground">
              Gunakan <code>**teks**</code> untuk menyorot kata kunci pada judul.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subtitle">Subjudul</Label>
            <Input
              id="subtitle"
              name="subtitle"
              defaultValue={initialValues?.subtitle ?? ""}
              placeholder="Contoh: Marketing. Strategy. Humanity."
              aria-describedby={state?.fieldErrors?.subtitle ? "subtitle-error" : undefined}
            />
            {state?.fieldErrors?.subtitle ? (
              <p id="subtitle-error" className="text-sm text-destructive">
                {state.fieldErrors.subtitle}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={initialValues?.description ?? ""}
              rows={5}
              placeholder="Gambarkan nilai utama yang ingin disampaikan pada slide ini."
              aria-describedby={state?.fieldErrors?.description ? "description-error" : undefined}
            />
            {state?.fieldErrors?.description ? (
              <p id="description-error" className="text-sm text-destructive">
                {state.fieldErrors.description}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Maksimal 600 karakter. Gunakan <code>**teks**</code> untuk menyorot kalimat penting.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="buttonLabel">Label Tombol</Label>
              <Input
                id="buttonLabel"
                name="buttonLabel"
                defaultValue={initialValues?.buttonLabel ?? ""}
                placeholder="Contoh: Download Free Ebook"
                aria-describedby={state?.fieldErrors?.buttonLabel ? "button-label-error" : undefined}
              />
              {state?.fieldErrors?.buttonLabel ? (
                <p id="button-label-error" className="text-sm text-destructive">
                  {state.fieldErrors.buttonLabel}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="buttonUrl">URL Tombol</Label>
              <Input
                id="buttonUrl"
                name="buttonUrl"
                defaultValue={initialValues?.buttonUrl ?? ""}
                placeholder="https://"
                aria-describedby={state?.fieldErrors?.buttonUrl ? "button-url-error" : undefined}
              />
              {state?.fieldErrors?.buttonUrl ? (
                <p id="button-url-error" className="text-sm text-destructive">
                  {state.fieldErrors.buttonUrl}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">Opsional. Kosongkan jika tidak diperlukan.</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Gambar Hero</Label>
              <div className="text-xs text-muted-foreground">
                {selectedMedia ? "Menggunakan media perpustakaan" : "URL kustom digunakan"}
              </div>
            </div>
            <FeaturedImagePicker
              initialItems={mediaItems}
              selected={selectedMedia}
              onSelect={handleSelectMedia}
              label="Pilih atau unggah gambar"
            />
            <input type="hidden" name="imageId" value={selectedMedia?.id ?? ""} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">URL Gambar Kustom</Label>
            <Input
              id="imageUrl"
              name="imageUrl"
              value={manualImageUrl}
              onChange={(event) => setManualImageUrl(event.target.value)}
              placeholder="https://"
              aria-describedby={state?.fieldErrors?.imageUrl ? "image-url-error" : undefined}
            />
            {state?.fieldErrors?.imageUrl ? (
              <p id="image-url-error" className="text-sm text-destructive">
                {state.fieldErrors.imageUrl}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Jika memilih media perpustakaan, URL ini akan diabaikan secara otomatis.
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-card/40 px-4 py-3">
            <input
              id="isActive"
              name="isActive"
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            <div>
              <Label htmlFor="isActive" className="text-sm font-semibold">
                Aktifkan slide ini
              </Label>
              <p className="text-xs text-muted-foreground">
                Nonaktifkan jika Anda ingin menyembunyikan slide tanpa menghapusnya.
              </p>
            </div>
          </div>
        </div>
      </div>

      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      <div className="flex items-center justify-end gap-3">
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}
