import { describe, expect, it } from "vitest";
import { badgeCatalog, computeBadges, computeLevel, computePoints, levelProgress } from "./contribution";

const zero = { notesCount: 0, likesReceived: 0, downloadsReceived: 0, coursesAdded: 0 };

describe("computePoints", () => {
  it("her katkı türü kendi ağırlığıyla", () => {
    expect(computePoints(zero)).toBe(0);
    expect(
      computePoints({
        notesCount: 2, // 20
        likesReceived: 3, // 15
        downloadsReceived: 7, // 7
        coursesAdded: 1, // 5
        referralsMade: 2, // 30
        requestsFulfilled: 1, // 20
        questPoints: 4, // 4
      }),
    ).toBe(101);
  });
});

describe("computeLevel / levelProgress", () => {
  it("seviye eşikleri", () => {
    expect(computeLevel(0)).toBe("Başlangıç");
    expect(computeLevel(19)).toBe("Başlangıç");
    expect(computeLevel(20)).toBe("Çırak");
    expect(computeLevel(75)).toBe("Deneyimli");
    expect(computeLevel(200)).toBe("Usta");
    expect(computeLevel(500)).toBe("Efsane");
  });

  it("levelProgress computeLevel ile tutarlı", () => {
    for (const p of [0, 19, 20, 74, 75, 199, 200, 499, 500, 9999]) {
      expect(levelProgress(p).level).toBe(computeLevel(p));
    }
  });

  it("sonraki seviyeye kalan ve yüzde", () => {
    expect(levelProgress(10)).toEqual({ level: "Başlangıç", next: "Çırak", toNext: 10, pct: 50 });
    expect(levelProgress(600)).toEqual({ level: "Efsane", next: null, toNext: 0, pct: 100 });
  });
});

describe("rozetler", () => {
  it("hiç katkı yoksa Yeni Üye", () => {
    expect(computeBadges(zero).map((b) => b.label)).toEqual(["Yeni Üye"]);
  });

  it("eşiklerde rozet kazanılır", () => {
    const labels = computeBadges({ ...zero, notesCount: 5, likesReceived: 10, referralsMade: 1 }).map((b) => b.label);
    expect(labels).toEqual(["İlk Katkı", "Aktif Paylaşımcı", "Beğenilen", "Davetçi"]);
  });

  it("katalogdaki ilerleme hedefle sınırlanır", () => {
    const cat = badgeCatalog({ ...zero, notesCount: 7 });
    const first = cat.find((b) => b.label === "İlk Katkı")!;
    const active = cat.find((b) => b.label === "Aktif Paylaşımcı")!;
    const sup = cat.find((b) => b.label === "Süper Katkıcı")!;
    expect(first.progress).toEqual([1, 1]);
    expect(active.earned).toBe(true);
    expect(sup).toMatchObject({ earned: false, progress: [7, 20] });
  });

  it("katalogda kazanılanlar computeBadges ile aynı (Yardımsever hariç)", () => {
    const s = { notesCount: 20, likesReceived: 50, downloadsReceived: 0, coursesAdded: 3, referralsMade: 1 };
    const earned = badgeCatalog(s).filter((b) => b.earned).map((b) => b.label);
    expect(earned).toEqual(computeBadges(s).map((b) => b.label));
  });
});
