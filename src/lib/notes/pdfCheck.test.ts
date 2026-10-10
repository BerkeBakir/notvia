import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { inspectPdf, sha256Hex } from "./pdfCheck";

async function makePdf(pages: number) {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) doc.addPage();
  return doc.save();
}

describe("inspectPdf", () => {
  it("geçerli PDF'i sayfa sayısıyla kabul eder", async () => {
    expect(await inspectPdf(await makePdf(3))).toEqual({ ok: true, pages: 3 });
  });

  it("boş dosya, PDF olmayan içerik ve bozuk PDF reddedilir", async () => {
    expect((await inspectPdf(new Uint8Array())).ok).toBe(false);
    expect(await inspectPdf(new TextEncoder().encode("merhaba dünya"))).toMatchObject({
      ok: false,
      reason: expect.stringContaining("geçerli bir PDF değil"),
    });
    const broken = (await makePdf(2)).slice(0, 60);
    expect(await inspectPdf(broken)).toMatchObject({ ok: false });
  });
});

describe("sha256Hex", () => {
  it("aynı içerik aynı özet, farklı içerik farklı özet", async () => {
    const a = new TextEncoder().encode("abc");
    expect(await sha256Hex(a.buffer as ArrayBuffer)).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
    const b = new TextEncoder().encode("abd");
    expect(await sha256Hex(b.buffer as ArrayBuffer)).not.toBe(await sha256Hex(a.buffer as ArrayBuffer));
  });
});
