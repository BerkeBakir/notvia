import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { isPaidPlan, paymentsEnabled, planForRef, subscriptionGrantsAccess } from "./config";
import { authHeader } from "./iyzico";

afterEach(() => vi.unstubAllEnvs());

describe("paymentsEnabled", () => {
  it("bayrak ve anahtarlar birlikte gerekir", () => {
    vi.stubEnv("PAYMENTS_ENABLED", "true");
    vi.stubEnv("IYZICO_API_KEY", "");
    expect(paymentsEnabled()).toBe(false);
    vi.stubEnv("IYZICO_API_KEY", "k");
    vi.stubEnv("IYZICO_SECRET_KEY", "s");
    vi.stubEnv("IYZICO_BASE_URL", "https://sandbox-api.iyzipay.com");
    expect(paymentsEnabled()).toBe(true);
    vi.stubEnv("PAYMENTS_ENABLED", "false");
    expect(paymentsEnabled()).toBe(false);
  });
});

describe("planForRef", () => {
  it("iyzico plan kodundan planı bulur, bilinmeyen kod null", () => {
    vi.stubEnv("IYZICO_PLAN_PREMIUM_MONTHLY", "ref-pm");
    vi.stubEnv("IYZICO_PLAN_PRO_YEARLY", "ref-py");
    expect(planForRef("ref-pm")).toBe("premium");
    expect(planForRef("ref-py")).toBe("pro");
    expect(planForRef("baska")).toBeNull();
    expect(planForRef(undefined)).toBeNull();
  });

  it("boş env değeri boş koda eşleşmez", () => {
    vi.stubEnv("IYZICO_PLAN_PREMIUM_MONTHLY", "");
    expect(planForRef("")).toBeNull();
  });
});

describe("abonelik durumu", () => {
  it("yalnızca ACTIVE/PENDING erişim verir", () => {
    expect(subscriptionGrantsAccess("ACTIVE")).toBe(true);
    expect(subscriptionGrantsAccess("PENDING")).toBe(true);
    for (const s of ["CANCELED", "EXPIRED", "UNPAID", "UPGRADED", null, undefined]) {
      expect(subscriptionGrantsAccess(s)).toBe(false);
    }
  });

  it("plan doğrulaması", () => {
    expect(isPaidPlan("pro")).toBe(true);
    expect(isPaidPlan("free")).toBe(false);
    expect(isPaidPlan("admin")).toBe(false);
  });
});

describe("IYZWSv2 authHeader", () => {
  it("randomKey + yol + gövdeyi HMAC-SHA256 ile imzalar", () => {
    const header = authHeader("api", "secret", "123", "/v2/x", '{"a":1}');
    expect(header.startsWith("IYZWSv2 ")).toBe(true);
    const decoded = Buffer.from(header.slice(8), "base64").toString();
    const sig = createHmac("sha256", "secret").update('123/v2/x{"a":1}').digest("hex");
    expect(decoded).toBe(`apiKey:api&randomKey:123&signature:${sig}`);
  });
});
