"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlbumStatus } from "@/lib/albums/types";
import { notifyError, notifySuccess } from "@/lib/notifications/client";

const fileReader = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("Gagal membaca file"));
    reader.readAsDataURL(file);
  });

type AlbumFormProps = {
  initialValues?: {
    id?: string;
    title?: string;
    description?: string | null;
    status?: AlbumStatus;
    images?: Array<{ id: string; url: string; caption: string | null }>;
  };
  submitLabel?: string;
};

export function AlbumForm({ initialValues, submitLabel = "Simpan Album" }: AlbumFormProps) {
  const router = useRouter();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (selectedFiles.length === 0) {
      const frame = window.requestAnimationFrame(() => {
        if (!cancelled) {
          setFilePreviews([]);
        }
      });
      return () => {
        cancelled = true;
        window.cancelAnimationFrame(frame);
      };
    }

    Promise.all(selectedFiles.map((file) => fileReader(file)))
      .then((previews) => {
        if (!cancelled) {
          setFilePreviews(previews);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFilePreviews([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedFiles]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialValues ? "Edit Album" : "Album Baru"}</CardTitle>
        <CardDescription>Isi detail album dan unggah gambar jika diperlukan.</CardDescription>
      </CardHeader>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const formElement = event.currentTarget;
          const formData = new FormData(formElement);
          const descriptions = selectedFiles.map((_, index) => {
            const description = formData.get(`file-description-${index}`);
            return typeof description === "string" ? description : "";
          });
          formData.set("fileDescriptions", JSON.stringify(descriptions));

          startTransition(async () => {
            setError(null);
            const endpoint = initialValues?.id ? `/api/dashboard/albums/${initialValues.id}` : "/api/dashboard/albums";
            const method = initialValues?.id ? "PATCH" : "POST";

            const response = await fetch(endpoint, {
              method,
              body: formData,
            });

            const body = await response.json().catch(() => null);
            if (!response.ok) {
              const message = body?.error ?? "Gagal menyimpan album.";
              setError(message);
              notifyError(message);
              return;
            }

            const albumId = body?.data?.id ?? initialValues?.id;
            notifySuccess("Album berhasil disimpan.");
            router.refresh();
            if (albumId) {
              router.push(`/dashboard/albums/${albumId}`);
            } else {
              router.push("/dashboard/albums");
            }
          });
        }}
      >
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title">Judul</Label>
            <Input id="title" name="title" required defaultValue={initialValues?.title ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              name="description"
              rows={4}
              defaultValue={initialValues?.description ?? ""}
              placeholder="Ceritakan isi album atau informasi penting lainnya"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              name="status"
              defaultValue={initialValues?.status ?? AlbumStatus.DRAFT}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value={AlbumStatus.DRAFT}>Draft</option>
              <option value={AlbumStatus.PUBLISHED}>Terbit</option>
            </select>
          </div>

          <div className="space-y-3">
            <Label htmlFor="files">Gambar baru</Label>
            <Input
              id="files"
              name="files"
              type="file"
              multiple
              accept="image/*"
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                setSelectedFiles(files);
              }}
            />
            {filePreviews.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {filePreviews.map((preview, index) => (
                  <div key={`new-preview-${index}`} className="flex flex-col gap-2 rounded border border-border/60 p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preview} alt={`Preview ${index + 1}`} className="h-32 rounded object-cover" />
                    <Input
                      name={`file-description-${index}`}
                      placeholder="Deskripsi gambar"
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {initialValues?.id ? (
            <input type="hidden" name="albumId" value={initialValues.id} />
          ) : null}
        </CardContent>
        <CardFooter className="flex flex-col items-end gap-3 sm:flex-row sm:justify-between">
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" disabled={isPending} className="min-w-[8rem]">
            {isPending ? "Menyimpan..." : submitLabel}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
