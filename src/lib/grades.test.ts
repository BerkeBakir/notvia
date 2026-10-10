import { describe, expect, it } from "vitest";
import { finalNeeded, gpa, normalCdf, num, relativeGrade } from "./grades";

describe("num", () => {
  it("boş girdi NaN, virgül ondalık", () => {
    expect(num("  ")).toBeNaN();
    expect(num("72,5")).toBe(72.5);
    expect(num("abc")).toBeNaN();
  });
});

describe("finalNeeded", () => {
  it("vize 40 → 60 ile geçmek için finalden ~56.67 gerekir", () => {
    const r = finalNeeded([{ weight: "40", score: "40" }], "60", "50", "")!;
    expect(r.earned).toBe(16);
    expect(r.total).toBe(100);
    expect(r.need).toBeCloseTo(56.667, 2);
  });

  it("final barajı hesaplanan değerden yüksekse baraj geçerli", () => {
    const r = finalNeeded([{ weight: "40", score: "100" }], "60", "50", "45")!;
    expect(r.rawNeed).toBeCloseTo(16.667, 2);
    expect(r.need).toBe(45);
  });

  it("zaten geçiyorsa gereken 0'ın altına inmez", () => {
    const r = finalNeeded([{ weight: "70", score: "100" }], "30", "50", "")!;
    expect(r.rawNeed).toBeLessThan(0);
    expect(r.need).toBe(0);
  });

  it("geçme notu boşsa 50 varsayılır", () => {
    expect(finalNeeded([{ weight: "50", score: "50" }], "50", "", "")!.target).toBe(50);
  });

  it("çok bileşen toplanır; eksik not varsa null", () => {
    const parts = [
      { weight: "20", score: "50" },
      { weight: "20", score: "100" },
    ];
    expect(finalNeeded(parts, "60", "50", "")!.earned).toBe(30);
    expect(finalNeeded([{ weight: "40", score: "" }], "60", "50", "")).toBeNull();
    expect(finalNeeded([{ weight: "40", score: "50" }], "", "50", "")).toBeNull();
  });
});

describe("normalCdf", () => {
  it("bilinen değerler", () => {
    expect(normalCdf(0)).toBeCloseTo(0.5, 4);
    expect(normalCdf(1)).toBeCloseTo(0.8413, 3);
    expect(normalCdf(-1.96)).toBeCloseTo(0.025, 3);
  });
});

describe("relativeGrade", () => {
  it("ortalamadaki not T=50 → BB, %50", () => {
    const r = relativeGrade("55", "15", "55")!;
    expect(r.z).toBe(0);
    expect(r.t).toBe(50);
    expect(r.letter).toBe("BB");
    expect(r.pct).toBeCloseTo(50, 1);
  });

  it("T-skoru sınırları", () => {
    expect(relativeGrade("50", "10", "59")!.letter).toBe("AA"); // T=59
    expect(relativeGrade("50", "10", "58.9")!.letter).toBe("BA");
    expect(relativeGrade("50", "10", "0")!.letter).toBe("FF");
  });

  it("geçersiz standart sapma veya boş girdi null", () => {
    expect(relativeGrade("50", "0", "60")).toBeNull();
    expect(relativeGrade("50", "-5", "60")).toBeNull();
    expect(relativeGrade("", "10", "60")).toBeNull();
  });
});

describe("gpa", () => {
  it("kredi ağırlıklı dönem ortalaması", () => {
    const r = gpa(
      [
        { credit: "4", letter: "AA" },
        { credit: "2", letter: "CC" },
      ],
      "",
      "",
    );
    expect(r.credits).toBe(6);
    expect(r.term).toBeCloseTo(10 / 3, 6);
    expect(r.cum).toBeNull();
  });

  it("kredisi boş/0 olan satır atlanır; hiç kredi yoksa null", () => {
    expect(gpa([{ credit: "", letter: "AA" }, { credit: "0", letter: "AA" }], "", "").term).toBeNull();
    expect(gpa([{ credit: "3", letter: "BB" }, { credit: "", letter: "FF" }], "", "").term).toBe(3);
  });

  it("önceki AGNO ile genel ortalama", () => {
    const r = gpa([{ credit: "30", letter: "AA" }], "2", "30");
    expect(r.cum).toBe(3);
  });
});
