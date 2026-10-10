import { describe, expect, it } from "vitest";
import { moderateRemove, moderateRestore } from "./moderation";

type Row = Record<string, unknown>;

/** Yalnızca moderasyonun kullandığı sorgu zincirlerini taklit eden sahte istemci. */
function fakeAdmin(note: Row | null, reports: Row[]) {
  const log: { table: string; op: string; payload?: unknown }[] = [];
  const chain = (table: string) => {
    let op = "select";
    let payload: unknown;
    const q = {
      select: () => q,
      eq: () => q,
      in: () => q,
      is: () => q,
      maybeSingle: async () => ({ data: table === "notes" ? note : null }),
      insert: async (p: unknown) => (log.push({ table, op: "insert", payload: p }), { error: null }),
      update: (p: unknown) => ((op = "update"), (payload = p), q),
      delete: () => ((op = "delete"), q),
      then: (res: (v: unknown) => void) => {
        if (op !== "select") log.push({ table, op, payload });
        res({ data: table === "reports" ? reports : null, error: null });
      },
    };
    return q;
  };
  const admin = { from: chain, storage: { from: () => ({ remove: async () => ({ error: null }) }) } };
  return { admin: admin as never, log };
}

const note = { id: "n1", user_id: "owner", course_id: "c", title: "Fizik", file_url: null, hidden_at: "2026-10-10" };
const reports = [{ user_id: "a" }, { user_id: "b" }, { user_id: "a" }, { user_id: "owner" }, { user_id: null }];

describe("moderateRestore", () => {
  it("notu açar, şikayetleri siler; sahibine 'geri açıldı', her şikayetçiye bir kez 'incelendi'", async () => {
    const { admin, log } = fakeAdmin(note, reports);
    expect((await moderateRestore(admin, "n1")).ok).toBe(true);
    expect(log.find((l) => l.table === "notes")).toMatchObject({ op: "update", payload: { hidden_at: null } });
    expect(log.some((l) => l.table === "reports" && l.op === "delete")).toBe(true);
    const notifs = log.find((l) => l.table === "notifications")!.payload as Row[];
    expect(notifs.map((n) => `${n.user_id}:${n.type}`)).toEqual([
      "owner:note_restored",
      "a:report_reviewed",
      "b:report_reviewed",
    ]);
  });

  it("gizlenmemiş not için sahibine bildirim gitmez", async () => {
    const { admin, log } = fakeAdmin({ ...note, hidden_at: null }, [{ user_id: "a" }]);
    await moderateRestore(admin, "n1");
    const notifs = log.find((l) => l.table === "notifications")!.payload as Row[];
    expect(notifs.map((n) => n.type)).toEqual(["report_reviewed"]);
  });
});

describe("moderateRemove", () => {
  it("notu siler; sahibine sebepli 'kaldırıldı', şikayetçilere 'incelendi'", async () => {
    const { admin, log } = fakeAdmin(note, reports);
    expect((await moderateRemove(admin, "n1", "Telif hakkı ihlali")).ok).toBe(true);
    const notifs = log.find((l) => l.table === "notifications")!.payload as Row[];
    expect(notifs[0]).toMatchObject({ user_id: "owner", type: "note_removed" });
    expect(String(notifs[0].message)).toContain("Telif hakkı ihlali");
    expect(notifs.slice(1).map((n) => n.user_id)).toEqual(["a", "b"]);
  });

  it("not yoksa hata", async () => {
    const { admin } = fakeAdmin(null, []);
    expect(await moderateRemove(admin, "x", "")).toEqual({ ok: false, error: "Not bulunamadı." });
  });
});
