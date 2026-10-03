import { describe, it, expect } from "vitest";
import { chunkText } from "./chunk";

describe("chunkText", () => {
  it("boş metinde boş dizi döner", () => {
    expect(chunkText("")).toEqual([]);
    expect(chunkText("   \n  ")).toEqual([]);
  });

  it("kısa metni tek parça yapar", () => {
    expect(chunkText("merhaba dünya")).toEqual(["merhaba dünya"]);
  });

  it("uzun metni örtüşmeli parçalara böler", () => {
    const text = "a".repeat(3500);
    const chunks = chunkText(text, { size: 1500, overlap: 200 });
    expect(chunks.length).toBe(3);
    expect(chunks[0].length).toBe(1500);
    // örtüşme: ikinci parça birincinin son 200 karakterinden başlar
    expect(chunks[1].length).toBe(1500);
    expect(chunks[2].length).toBe(3500 - 2 * (1500 - 200));
  });
});
