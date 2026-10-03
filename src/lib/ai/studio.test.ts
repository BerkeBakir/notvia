import { describe, expect, it } from "vitest";
import { parseStudioOutput } from "./studio";

describe("parseStudioOutput", () => {
  it("quiz: kod bloğu içindeki JSON'u okur, bozuk soruları atar", () => {
    const raw =
      '```json\n{"questions":[{"q":"BCD nedir?","options":["a","b","c","d"],"answer":1,"explanation":"x"},' +
      '{"q":"bozuk","options":["a"],"answer":0},{"q":"aralık dışı","options":["a","b"],"answer":5}]}\n```';
    const r = parseStudioOutput("quiz", raw);
    expect(r.kind).toBe("quiz");
    if (r.kind === "quiz") {
      expect(r.questions).toHaveLength(1);
      expect(r.questions[0].answer).toBe(1);
    }
  });

  it("flashcards: önündeki/arkasındaki metni yok sayar", () => {
    const r = parseStudioOutput("flashcards", 'İşte kartlar: {"cards":[{"front":"MUX","back":"Veri seçici"},{"front":"","back":"x"}]} bitti');
    expect(r.kind === "flashcards" && r.cards).toEqual([{ front: "MUX", back: "Veri seçici" }]);
  });

  it("quiz: geçerli soru yoksa hata verir", () => {
    expect(() => parseStudioOutput("quiz", '{"questions":[]}')).toThrow();
  });

  it("markdown türleri metni olduğu gibi döndürür", () => {
    expect(parseStudioOutput("faq", "  ### Soru?\nCevap ")).toEqual({ kind: "faq", markdown: "### Soru?\nCevap" });
  });
});
