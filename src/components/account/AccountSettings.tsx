"use client";

import { useActionState, useState } from "react";
import { CheckCircle, Circle, Key, Trash, Warning } from "@phosphor-icons/react";
import { changePassword, deleteAccount, type ActionResult } from "@/lib/actions/account";
import { PASSWORD_RULES, passwordOk } from "@/lib/passwordRules";

const input =
  "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-4 focus:ring-primary/10";

function Result({ r }: { r: ActionResult | null }) {
  if (!r) return null;
  return (
    <p
      className={`rounded-xl border px-3 py-2 text-sm ${
        r.ok ? "border-primary/40 bg-primary/10 text-primary" : "border-red-500/40 bg-red-500/10 text-red-400"
      }`}
    >
      {r.message}
    </p>
  );
}

export function PasswordSection({ hasPassword }: { hasPassword: boolean }) {
  const [state, action, pending] = useActionState(changePassword, null);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const ready = passwordOk(pw) && pw === pw2;

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h2 className="flex items-center gap-2 font-heading text-lg font-semibold text-card-foreground">
        <Key size={20} weight="duotone" className="text-primary" /> {hasPassword ? "Şifre değiştir" : "Şifre belirle"}
      </h2>
      {!hasPassword && (
        <p className="mt-1 text-sm text-muted">
          Google ile giriş yapıyorsun. İstersen bir şifre belirle; e-posta + şifreyle de girebilirsin.
        </p>
      )}
      <form
        action={(fd) => {
          action(fd);
        }}
        className="mt-4 space-y-3"
      >
        {hasPassword && (
          <input name="current" type="password" required autoComplete="current-password" placeholder="Mevcut şifre" className={input} />
        )}
        <input
          name="next"
          type="password"
          required
          autoComplete="new-password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="Yeni şifre"
          className={input}
        />
        <ul className="grid grid-cols-1 gap-1 rounded-xl border border-border bg-background/40 px-3 py-2.5 text-xs sm:grid-cols-2">
          {PASSWORD_RULES.map((r) => (
            <li key={r.key} className={`flex items-center gap-1.5 ${r.test(pw) ? "text-primary" : "text-muted"}`}>
              {r.test(pw) ? <CheckCircle size={14} weight="fill" /> : <Circle size={14} />}
              {r.label}
            </li>
          ))}
        </ul>
        <input
          name="next2"
          type="password"
          required
          autoComplete="new-password"
          value={pw2}
          onChange={(e) => setPw2(e.target.value)}
          placeholder="Yeni şifreyi tekrar yaz"
          className={input}
        />
        {pw2 && pw !== pw2 && <p className="text-xs text-red-400">Şifreler eşleşmiyor</p>}
        <Result r={state} />
        <button
          type="submit"
          disabled={!ready || pending}
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Kaydediliyor..." : hasPassword ? "Şifreyi değiştir" : "Şifreyi belirle"}
        </button>
      </form>
    </section>
  );
}

export function DeleteSection() {
  const [state, action, pending] = useActionState(deleteAccount, null);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  return (
    <section className="rounded-2xl border border-red-500/30 bg-red-500/5 p-5">
      <h2 className="flex items-center gap-2 font-heading text-lg font-semibold text-red-400">
        <Warning size={20} weight="duotone" /> Hesabı sil
      </h2>
      <p className="mt-1 text-sm text-muted">
        Hesabın ve yüklediğin notlar, yorumların, beğenilerin, AI geçmişin dahil tüm verilerin <b>kalıcı olarak</b>{" "}
        silinir. Bu işlem geri alınamaz.
      </p>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-red-500/40 px-4 py-2 text-sm text-red-400 transition hover:bg-red-500/10"
        >
          <Trash size={16} /> Hesabımı silmek istiyorum
        </button>
      ) : (
        <form action={action} className="mt-4 space-y-3">
          <label className="block text-sm text-foreground">
            Onaylamak için kutuya <b>SİL</b> yaz:
          </label>
          <input
            name="confirm"
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoComplete="off"
            placeholder="SİL"
            className={`${input} border-red-500/40`}
          />
          <Result r={state} />
          <div className="flex gap-2">
            <button type="button" onClick={() => setOpen(false)} className="rounded-xl px-4 py-2 text-sm text-muted hover:text-foreground">
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={text.trim().toLocaleUpperCase("tr") !== "SİL" || pending}
              className="rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-40"
            >
              {pending ? "Siliniyor..." : "Hesabımı kalıcı olarak sil"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
