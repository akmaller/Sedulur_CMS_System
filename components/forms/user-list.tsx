"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateUser, deleteUserAction } from "./actions";
import { notifyError, notifySuccess } from "@/lib/notifications/client";

type UserRecord = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "EDITOR" | "AUTHOR";
  emailVerified: string | null;
  canPublish: boolean;
  createdAt: string;
};

type UserListProps = {
  users: UserRecord[];
  currentUserId: string;
};

function resolveRoleBadge(role: string) {
  switch (role) {
    case "ADMIN":
      return { label: "Admin", variant: "default" as const };
    case "EDITOR":
      return { label: "Editor", variant: "secondary" as const };
    default:
      return { label: "Author", variant: "outline" as const };
  }
}

export function UserList({ users, currentUserId }: UserListProps) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pendingUpdateId, setPendingUpdateId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ userId: string; type: "success" | "error"; message: string } | null>(null);

  const handleEditSubmit = async (event: React.FormEvent<HTMLFormElement>, userId: string) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    // Ensure checkboxes always present
    formData.set("emailVerified", form.emailVerified?.checked ? "on" : "");
    formData.set("canPublish", form.canPublish?.checked ? "on" : "");

    setPendingUpdateId(userId);
    setFeedback(null);

    const result = await updateUser(formData);

    if (result?.error) {
      setFeedback({ userId, type: "error", message: result.error });
      notifyError(result.error);
    } else {
      setFeedback({ userId, type: "success", message: "Pengguna berhasil diperbarui." });
      notifySuccess("Pengguna berhasil diperbarui.");
      setExpandedId(null);
      router.refresh();
    }

    setPendingUpdateId(null);
  };

  const handleDelete = async (userId: string) => {
    if (!window.confirm("Hapus pengguna ini? Tindakan tidak dapat dibatalkan.")) {
      return;
    }
    setPendingDeleteId(userId);
    const result = await deleteUserAction(userId);
    if (result?.error) {
      notifyError(result.error);
    } else {
      notifySuccess("Pengguna berhasil dihapus.");
      router.refresh();
    }
    setPendingDeleteId(null);
  };

  return (
    <Card className="border-border/60 bg-card/60">
      <CardHeader>
        <CardTitle>Daftar Pengguna</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {users.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada pengguna. Tambahkan akun pertama Anda.</p>
        ) : (
          <div className="space-y-2">
            {users.map((user) => {
              const badge = resolveRoleBadge(user.role);
              const isExpanded = expandedId === user.id;
              const isSelf = user.id === currentUserId;
              const isUpdating = pendingUpdateId === user.id;
              const isDeleting = pendingDeleteId === user.id;
              const userFeedback = feedback?.userId === user.id ? feedback : null;

              return (
                <div
                  key={user.id}
                  className="rounded-lg border border-border/60 bg-background/40 px-3 py-3"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium text-foreground">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                      <p className="text-[11px] text-muted-foreground/80">
                        Dibuat {new Date(user.createdAt).toLocaleString("id-ID")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setExpandedId((prev) => (prev === user.id ? null : user.id))}
                      >
                        {isExpanded ? "Tutup" : "Edit"}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={isSelf || isDeleting}
                        onClick={() => handleDelete(user.id)}
                      >
                        {isDeleting ? "Menghapus..." : "Hapus"}
                      </Button>
                    </div>
                  </div>

                  {isExpanded ? (
                    <form
                      className="mt-4 space-y-4 rounded-lg border border-border/50 bg-background/60 p-4"
                      onSubmit={(event) => handleEditSubmit(event, user.id)}
                    >
                      <input type="hidden" name="id" value={user.id} />
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor={`name-${user.id}`}>Nama</Label>
                          <Input
                            id={`name-${user.id}`}
                            name="name"
                            defaultValue={user.name}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`email-${user.id}`}>Email</Label>
                          <Input
                            id={`email-${user.id}`}
                            name="email"
                            type="email"
                            defaultValue={user.email}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`password-${user.id}`}>Password Baru</Label>
                          <Input
                            id={`password-${user.id}`}
                            name="password"
                            type="password"
                            placeholder="Kosongkan jika tidak diganti"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`role-${user.id}`}>Peran</Label>
                          <select
                            id={`role-${user.id}`}
                            name="role"
                            defaultValue={user.role}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          >
                            <option value="ADMIN">Admin</option>
                            <option value="EDITOR">Editor</option>
                            <option value="AUTHOR">Author</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
                          <label className="inline-flex items-center gap-2 text-sm text-foreground">
                            <input
                              type="checkbox"
                              name="emailVerified"
                              defaultChecked={Boolean(user.emailVerified)}
                              className="h-4 w-4 rounded border-border text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                            />
                            Email terverifikasi
                          </label>
                          <label className="inline-flex items-center gap-2 text-sm text-foreground">
                            <input
                              type="checkbox"
                              name="canPublish"
                              defaultChecked={user.canPublish}
                              className="h-4 w-4 rounded border-border text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                            />
                            Izinkan publikasi
                          </label>
                        </div>

                        <div className="flex items-center gap-2">
                          {userFeedback ? (
                            <p
                              className={`text-xs ${
                                userFeedback.type === "error"
                                  ? "text-destructive"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {userFeedback.message}
                            </p>
                          ) : null}
                          <Button type="submit" disabled={isUpdating}>
                            {isUpdating ? "Menyimpan..." : "Simpan Perubahan"}
                          </Button>
                        </div>
                      </div>
                    </form>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
