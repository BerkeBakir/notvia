"use client";

import { useActionState, useState } from "react";
import { ChatCircleDots } from "@phosphor-icons/react";
import { savePremiumInterest } from "@/lib/actions/payments";

const chip = (active: boolean) =>
  `rounded-full border px-3.5 py-1.5 text-sm transition ${
    active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted hover:text-foreground"
  }`;

export interface InterestAnswer {
  answer: string;
  plan: string | null;
  max_price: string | null;
  wants: string | null;
}

/** "Premium alır mıydın?" anketi — ödeme açılmadan önce talebi ölçmek için. */
export function PremiumInterest({ loggedIn, initial }: { loggedIn: boolean; initial: InterestAnswer | null }) {
  const [state, action, pending] = useActionState(savePremiumInterest, null);
  const [answer, setAnswer] = useState(initial?.answer ?? "");
  const [plan, setPlan] = useState(initial?.plan ?? "");
  const [price, setPrice] = useState(initial?.max_price ?? "");

  return (
    <section className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-6">
      <h2 className="flex items-center gap-2 font-heading text-lg font-semibold text-card-foreground">
        <ChatCircleDots size={22} weight="duotone" className="text-primary" /> Premium çıksa alır mıydın?
      </h2>
      <p className="mt-1 text-sm text-muted">
        Fiyatları ve özellikleri senin cevabına göre belirleyeceğiz. 20 saniyeni alır.
      </p>

      {!loggedIn ? (
        <p className="mt-4 text-sm text-muted">
          Cevap vermek için{" "}
          <a href="/login?next=/premium" className="text-primary hover:underline">
            giriş yap
          </a>
          .
        </p>
      ) : (
        <form action={action} className="mt-4 space-y-4">
          <input type="hidden" name="answer" value={answer} />
          <input type="hidden" name="plan" value={plan} />
          <input type="hidden" name="max_price" value={price} />

          <div className="flex flex-wrap gap-2">
            {[
              ["evet", "Evet, alırdım"],
              ["belki", "Belki, fiyata bağlı"],
              ["hayir", "Hayır"],
            ].map(([v, l]) => (
              <button key={v} type="button" className={chip(answer === v)} onClick={() => setAnswer(v)}>
                {l}
              </button>
            ))}
          </div>

          {answer && answer !== "hayir" && (
            <>
              <div>
                <p className="mb-2 text-sm text-foreground">Hangisi ilgini çekiyor?</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    ["premium", "Premium (reklamsız, sınırsız indirme, 50 AI sorusu)"],
                    ["pro", "Pro (sınırsız AI)"],
                  ].map(([v, l]) => (
                    <button key={v} type="button" className={chip(plan === v)} onClick={() => setPlan(v)}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm text-foreground">Ayda en fazla ne öderdin?</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    ["0-25", "25 ₺'ye kadar"],
                    ["25-50", "25–50 ₺"],
                    ["50-100", "50–100 ₺"],
                    ["100+", "100 ₺ üstü"],
                  ].map(([v, l]) => (
                    <button key={v} type="button" className={chip(price === v)} onClick={() => setPrice(v)}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <textarea
            name="wants"
            maxLength={500}
            defaultValue={initial?.wants ?? ""}
            placeholder={answer === "hayir" ? "Neden almazdın? (isteğe bağlı)" : "Premium'da ne olsa kesin alırdın? (isteğe bağlı)"}
            className="w-full rounded-xl border border-border bg-background/40 px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted focus:border-primary"
            rows={2}
          />

          {state && (
            <p className={`text-sm ${state.ok ? "text-primary" : "text-red-400"}`}>{state.message}</p>
          )}
          <button
            type="submit"
            disabled={!answer || pending}
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "Kaydediliyor…" : initial ? "Cevabımı güncelle" : "Gönder"}
          </button>
        </form>
      )}
    </section>
  );
}
