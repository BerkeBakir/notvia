// iyzico Abonelik API istemcisi (bağımlılıksız). Kimlik doğrulama: IYZWSv2 (HMAC-SHA256).
// Sandbox için IYZICO_BASE_URL=https://sandbox-api.iyzipay.com, canlı için https://api.iyzipay.com
import { createHmac, randomBytes } from "node:crypto";

export interface IyzicoResponse<T = Record<string, unknown>> {
  status: "success" | "failure";
  errorCode?: string;
  errorMessage?: string;
  data?: T;
  [key: string]: unknown;
}

/** IYZWSv2 Authorization başlığı. Saf fonksiyon: test edilebilir. */
export function authHeader(apiKey: string, secretKey: string, randomKey: string, uriPath: string, body: string) {
  const signature = createHmac("sha256", secretKey).update(randomKey + uriPath + body).digest("hex");
  const auth = `apiKey:${apiKey}&randomKey:${randomKey}&signature:${signature}`;
  return "IYZWSv2 " + Buffer.from(auth).toString("base64");
}

async function call<T>(method: "GET" | "POST", path: string, payload?: unknown): Promise<IyzicoResponse<T>> {
  const apiKey = process.env.IYZICO_API_KEY!;
  const secretKey = process.env.IYZICO_SECRET_KEY!;
  const base = process.env.IYZICO_BASE_URL!.replace(/\/$/, "");
  const body = payload === undefined ? "" : JSON.stringify(payload);
  const randomKey = Date.now().toString() + randomBytes(6).toString("hex");
  const res = await fetch(base + path, {
    method,
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      "x-iyzi-rnd": randomKey,
      authorization: authHeader(apiKey, secretKey, randomKey, path, body),
    },
    body: method === "POST" ? body : undefined,
    cache: "no-store",
  });
  const json = (await res.json().catch(() => null)) as IyzicoResponse<T> | null;
  if (!json) return { status: "failure", errorMessage: `iyzico ${res.status}: geçersiz yanıt` };
  return json;
}

export interface CheckoutCustomer {
  name: string;
  surname: string;
  email: string;
  gsmNumber: string;
  identityNumber: string;
  city: string;
  address: string;
}

/** Abonelik ödeme formunu başlatır; dönen checkoutFormContent sayfaya gömülür. */
export function initSubscriptionCheckout(opts: {
  pricingPlanReferenceCode: string;
  callbackUrl: string;
  conversationId: string;
  customer: CheckoutCustomer;
}) {
  const c = opts.customer;
  const address = { contactName: `${c.name} ${c.surname}`, city: c.city, country: "Turkey", address: c.address };
  return call<never>("POST", "/v2/subscription/checkoutform/initialize", {
    locale: "tr",
    conversationId: opts.conversationId,
    callbackUrl: opts.callbackUrl,
    pricingPlanReferenceCode: opts.pricingPlanReferenceCode,
    subscriptionInitialStatus: "ACTIVE",
    customer: {
      name: c.name,
      surname: c.surname,
      email: c.email,
      gsmNumber: c.gsmNumber,
      identityNumber: c.identityNumber,
      billingAddress: address,
      shippingAddress: address,
    },
  }) as Promise<IyzicoResponse & { token?: string; checkoutFormContent?: string }>;
}

export interface SubscriptionData {
  referenceCode: string;
  subscriptionStatus: string;
  pricingPlanReferenceCode: string;
  customerReferenceCode?: string;
}

/** Ödeme formu sonucunu token ile getirir (geri dönüş adresinde). */
export function retrieveCheckout(token: string) {
  return call<SubscriptionData>("GET", `/v2/subscription/checkoutform/${encodeURIComponent(token)}`);
}

/** Aboneliğin güncel durumu (webhook'ta tek doğruluk kaynağı). */
export function getSubscription(referenceCode: string) {
  return call<SubscriptionData>("GET", `/v2/subscription/subscriptions/${encodeURIComponent(referenceCode)}`);
}

export function cancelSubscription(referenceCode: string) {
  return call<never>("POST", `/v2/subscription/subscriptions/${encodeURIComponent(referenceCode)}/cancel`, {});
}
