import { describe, expect, it } from "vitest";
import { matchScore, norm } from "./textMatch";
import { passwordOk, PASSWORD_RULES } from "./passwordRules";
import { computeRating, isCommunityApproved, ratingStars, wilsonScore } from "./rating";
import { cleanReferralCode, referralCode } from "./referralCode";
import { safeNext } from "./safeNext";
import { esc } from "./email/escape";
import { CATALOG_PREFIX, departmentOptions } from "./departmentCatalog";

describe("textMatch", () => {
  it("Türkçe harf ve aksan katlama", () => {
    expect(norm("İSTANBUL")).toBe("istanbul");
    expect(norm("Işık Üniversitesi")).toBe("isik universitesi");
    expect(norm("Güvenlik")).toBe(norm("guvenlik"));
  });

  it("baştan / kelime başı / kısaltma = 2, içinde = 1, yok = 0", () => {
    expect(matchScore("Orta Doğu Teknik Üniversitesi", "odtu")).toBe(2);
    expect(matchScore("Orta Doğu Teknik Üniversitesi", "teknik")).toBe(2);
    expect(matchScore("Orta Doğu Teknik Üniversitesi", "ekni")).toBe(1);
    expect(matchScore("Orta Doğu Teknik Üniversitesi", "boğaziçi")).toBe(0);
    expect(matchScore("Bilgi ve Ağ Güvenliği", "ag guv")).toBe(1);
    expect(matchScore("herhangi", "   ")).toBe(2);
  });
});

describe("passwordRules", () => {
  it("tüm kurallar sağlanınca geçer", () => {
    expect(passwordOk("Notvia2026!")).toBe(true);
    expect(passwordOk("Şifre12.")).toBe(true);
  });

  it("her kural tek başına reddeder", () => {
    expect(passwordOk("Ab1!")).toBe(false); // kısa
    expect(passwordOk("notvia2026!")).toBe(false); // büyük harf yok
    expect(passwordOk("NOTVIA2026!")).toBe(false); // küçük harf yok
    expect(passwordOk("Notviaaaa!")).toBe(false); // rakam yok
    expect(passwordOk("Notvia2026")).toBe(false); // özel karakter yok
  });

  it("Türkçe harfler özel karakter sayılmaz, boşluk sayılmaz", () => {
    const special = PASSWORD_RULES.find((r) => r.key === "special")!;
    expect(special.test("Çağrı Öğün")).toBe(false);
    expect(special.test("a_b")).toBe(true);
  });
});

describe("rating", () => {
  it("oy yoksa null, oran 5 üzerinden bir ondalık", () => {
    expect(computeRating(0, 0)).toBeNull();
    expect(computeRating(1, 0)).toBe(5);
    expect(computeRating(2, 1)).toBe(3.3);
    expect(computeRating(0, 3)).toBe(0);
  });

  it("yıldız dizisi 5 karakter", () => {
    expect(ratingStars(3.3)).toBe("★★★☆☆");
    expect(ratingStars(4.5)).toBe("★★★★★");
    expect(ratingStars(0)).toBe("☆☆☆☆☆");
  });
});

describe("referralCode", () => {
  it("UUID'nin ilk 8 hex hanesi, büyük harf", () => {
    expect(referralCode("5164375e-aaaa-bbbb-cccc-dddddddddddd")).toBe("5164375E");
  });

  it("kullanıcı girdisini temizler", () => {
    expect(cleanReferralCode(" 5164-375e ")).toBe("5164375E");
    expect(cleanReferralCode("5164375e99")).toBe("5164375E");
    expect(cleanReferralCode("xyz")).toBe("");
  });
});

describe("safeNext (açık yönlendirme koruması)", () => {
  it("yalnızca site içi göreli yollar", () => {
    expect(safeNext("/profile")).toBe("/profile");
    expect(safeNext("/notes?x=1")).toBe("/notes?x=1");
  });

  it("dış adresler ve boş girdi fallback'e düşer", () => {
    for (const bad of [null, undefined, "", "https://evil.com", "//evil.com", "/\\evil.com", "evil.com"]) {
      expect(safeNext(bad)).toBe("/notes");
    }
    expect(safeNext("//evil.com", "/")).toBe("/");
  });
});

describe("esc", () => {
  it("HTML özel karakterlerini kaçışlar", () => {
    expect(esc(`<img src="x" onerror='a&b'>`)).toBe("&lt;img src=&quot;x&quot; onerror=&#39;a&amp;b&#39;&gt;");
    expect(esc(null)).toBe("");
    expect(esc(undefined)).toBe("");
  });
});

describe("departmentOptions", () => {
  it("mevcut bölümler id ile, katalogdakiler önekle; büyük/küçük harf duyarsız tekilleştirme", () => {
    const opts = departmentOptions([{ id: "d1", name: "bilgisayar mühendisliği" }]);
    expect(opts.find((o) => o.value === "d1")).toBeTruthy();
    expect(opts.filter((o) => o.label.toLocaleLowerCase("tr") === "bilgisayar mühendisliği")).toHaveLength(1);
    expect(opts.some((o) => o.value.startsWith(CATALOG_PREFIX))).toBe(true);
  });
});

describe("wilsonScore (adil sıralama)", () => {
  it("1 beğenili not, 40 beğenili notun önüne geçemez", () => {
    expect(wilsonScore(1, 0)).toBeLessThan(wilsonScore(40, 2));
    expect(computeRating(1, 0)).toBeGreaterThan(computeRating(40, 2)!); // eski yıldız oranı tersini söylüyordu
  });

  it("bilinen değerler, oy yoksa 0, 0-1 aralığında", () => {
    expect(wilsonScore(0, 0)).toBe(0);
    expect(wilsonScore(1, 0)).toBeCloseTo(0.207, 3);
    expect(wilsonScore(40, 2)).toBeCloseTo(0.842, 3);
    expect(wilsonScore(0, 10)).toBeGreaterThanOrEqual(0);
    expect(wilsonScore(1000, 0)).toBeLessThan(1);
  });

  it("aynı oranda daha çok oy daha yüksek puan", () => {
    expect(wilsonScore(10, 2)).toBeGreaterThan(wilsonScore(5, 1));
  });
});

describe("isCommunityApproved", () => {
  it("en az 5 beğeni ve net çoğunluk gerekir", () => {
    expect(isCommunityApproved(4, 0)).toBe(false);
    expect(isCommunityApproved(5, 0)).toBe(true);
    expect(isCommunityApproved(6, 1)).toBe(false);
    expect(isCommunityApproved(40, 2)).toBe(true);
    expect(isCommunityApproved(20, 15)).toBe(false);
  });
});
