export enum AlbumStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
}

export type AlbumFormResult =
  | { success: true; albumId: string }
  | { success?: false; error?: string };
