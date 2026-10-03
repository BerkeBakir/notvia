import { describe, it, expect } from "vitest";
import { remainingFor, FREE_DAILY_LIMIT } from "./limit";

describe("remainingFor", () => {
  it("pro sınırsız", () => {
    expect(remainingFor("pro", 999)).toBe(Infinity);
  });
  it("ücretsiz kalanı doğru hesaplar", () => {
    expect(remainingFor("free", 0)).toBe(FREE_DAILY_LIMIT);
    expect(remainingFor("free", 3)).toBe(FREE_DAILY_LIMIT - 3);
  });
  it("limit aşılınca 0'ın altına inmez", () => {
    expect(remainingFor("free", 99)).toBe(0);
  });
});
