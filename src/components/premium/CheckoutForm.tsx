"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LockSimple } from "@phosphor-icons/react";
import type { Billing, PaidPlan } from "@/lib/payments/config";

const input =
  "w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-4 focus:ring-primary/10";

/** iyzico'nun döndürdüğü form betiğini sayfaya ekler (innerHTML betikleri çalıştırmaz). */
function mountIyzico(container: HTMLElement, content: string) {
  container.innerHTML = '<div id="iyzipay-checkout-form" class="responsive"></div>';
  const tmp = document.createElement("div");
  tmp.innerHTML = content;
  tmp.querySelectorAll("script").forEach((old) => {
    const s = document.createElement("script");
    for (const a of Array.from(old.attributes)) s.setAttribute(a.name, a.value);
    s.text = old.text;
    container.appendChild(s);
  });
}

export function CheckoutForm({
  plan,
  billing,
  price,
  defaultName,
  defaultSurname,
}: {
  plan: PaidPlan;
  billing: Billing;
  price: number;
  defaultName: string;
  defaultSurname: string;
}) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [content, setContent] = useState<string | null>(null);
  const formHost = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (content && formHost.current) mountIyzico(formHost.current, content);
  }, [content]);

  async function submit(fd: FormData) {
    setError("");
    setPending(true);
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ plan, billing, ...Object.fromEntries(fd) }),
    }).catch(() => null);
    const json = await res?.json().catch(() => null);
    setPending(false);
    if (!res?.ok || !json?.checkoutFormContent) return setError(json?.error ?? "Ödeme başlatılamadı.");
    setContent(json.checkoutFormContent);
  }

  const planName = plan === "pro" ? "Pro" : "Premium";
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">{planName} üyelik</h1>
        <p className="mt-1 text-muted">
          {price} ₺ / {billing === "yearly" ? "yıl" : "ay"} · otomatik yenilenir, istediğin zaman Ayarlar&apos;dan iptal
          edebilirsin.
        </p>
      </div>

      {content ? (
        <div ref={formHost} />
      ) : (
        <form action={submit} className="space-y-3 rounded-2xl border border-border bg-card p-5">
          <p className="text-sm text-muted">Fatura bilgileri (iyzico tarafından zorunlu tutulur)</p>
          <div className="grid grid-cols-2 gap-3">
            <input name="name" required defaultValue={defaultName} placeholder="Ad" className={input} />
            <input name="surname" required defaultValue={defaultSurname} placeholder="Soyad" className={input} />
          </div>
          <input name="gsmNumber" required inputMode="tel" placeholder="Cep telefonu (05XX XXX XX XX)" className={input} />
          <input
            name="identityNumber"
            inputMode="numeric"
            maxLength={11}
            placeholder="T.C. kimlik no (isteğe bağlı, fatura için)"
            className={input}
          />
          <div className="grid grid-cols-[8rem_1fr] gap-3">
            <input name="city" required placeholder="Şehir" className={input} />
            <input name="address" required placeholder="Adres" className={input} />
          </div>
          <label className="flex items-start gap-2 text-sm text-muted">
            <input type="checkbox" required className="mt-1" />
            <span>
              <Link href="/on-bilgilendirme" target="_blank" className="text-primary hover:underline">
                Ön Bilgilendirme Formu
              </Link>
              &apos;nu ve{" "}
              <Link href="/mesafeli-satis" target="_blank" className="text-primary hover:underline">
                Mesafeli Satış Sözleşmesi
              </Link>
              &apos;ni okudum, onaylıyorum. Dijital hizmetin hemen ifasına onay verdiğimi ve bu nedenle cayma
              hakkımın{" "}
              <Link href="/iade" target="_blank" className="text-primary hover:underline">
                İptal ve İade Koşulları
              </Link>
              &apos;nda belirtildiği şekilde uygulanacağını biliyorum.
            </span>
          </label>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            <LockSimple size={16} weight="bold" /> {pending ? "Hazırlanıyor…" : "Güvenli ödemeye geç"}
          </button>
        </form>
      )}
    </div>
  );
}
