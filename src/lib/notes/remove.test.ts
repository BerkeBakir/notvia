import { describe, expect, it, vi } from "vitest";
import { isOwnerDeleteReason, removeNote, storagePathFromUrl } from "./remove";

describe("storagePathFromUrl", () => {
  it("public URL'den kova içi yolu çıkarır", () => {
    expect(
      storagePathFromUrl("https://x.supabase.co/storage/v1/object/public/notes/uid/1700-ders%20notu.pdf"),
    ).toBe("uid/1700-ders notu.pdf");
    expect(storagePathFromUrl("https://x.supabase.co/storage/v1/object/public/notes/a/b.pdf?t=1")).toBe("a/b.pdf");
  });

  it("başka kova, boş ya da yol gezinmesi null", () => {
    expect(storagePathFromUrl("https://x.supabase.co/storage/v1/object/public/avatars/a.png")).toBeNull();
    expect(storagePathFromUrl(null)).toBeNull();
    expect(storagePathFromUrl("https://x/storage/v1/object/public/notes/../secret")).toBeNull();
  });
});

describe("isOwnerDeleteReason", () => {
  it("yalnızca tanımlı sebepler", () => {
    expect(isOwnerDeleteReason("yanlis_ders")).toBe(true);
    expect(isOwnerDeleteReason("toString")).toBe(false);
    expect(isOwnerDeleteReason("moderasyon")).toBe(false);
  });
});

describe("removeNote", () => {
  function fakeAdmin(deleteError: string | null = null) {
    const calls: string[] = [];
    const admin = {
      from: (table: string) => ({
        insert: vi.fn(async () => {
          calls.push(`insert:${table}`);
          return { error: null };
        }),
        delete: () => ({
          eq: vi.fn(async () => {
            calls.push(`delete:${table}`);
            return { error: deleteError ? { message: deleteError } : null };
          }),
        }),
      }),
      storage: {
        from: () => ({
          remove: vi.fn(async (paths: string[]) => {
            calls.push(`remove:${paths.join(",")}`);
            return { error: null };
          }),
        }),
      },
    };
    return { admin, calls };
  }
  const note = {
    id: "n1",
    user_id: "u1",
    course_id: "c1",
    title: "Vize notları",
    file_url: "https://x/storage/v1/object/public/notes/u1/a.pdf",
  };

  it("kayıt düşer, satır silinir, sonra PDF silinir", async () => {
    const { admin, calls } = fakeAdmin();
    const res = await removeNote(admin as never, note, { by: "owner", reason: "yanlis_ders" });
    expect(res.ok).toBe(true);
    expect(calls).toEqual(["insert:note_deletions", "delete:notes", "remove:u1/a.pdf"]);
  });

  it("satır silinemezse PDF'e dokunulmaz", async () => {
    const { admin, calls } = fakeAdmin("boom");
    const res = await removeNote(admin as never, note, { by: "owner", reason: "diger", detail: "x" });
    expect(res).toEqual({ ok: false, error: "boom" });
    expect(calls.some((c) => c.startsWith("remove:"))).toBe(false);
  });
});
