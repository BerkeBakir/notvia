"use client";

import { useMemo, useState } from "react";
import { Calculator, ChartLine, Plus, Student, Trash } from "@phosphor-icons/react";
import { Combobox } from "@/components/ui/Combobox";
import { finalNeeded, gpa, LETTERS, relativeGrade } from "@/lib/grades";

const input =
  "w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-4 focus:ring-primary/10";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted">
        {label} {hint && <span className="font-normal opacity-70">· {hint}</span>}
      </span>
      {children}
    </label>
  );
}

/* ───────────── 1) Finalden kaç lazım ───────────── */
type Part = { id: number; name: string; weight: string; score: string };

function FinalNeeded() {
  const [parts, setParts] = useState<Part[]>([{ id: 1, name: "Vize", weight: "40", score: "" }]);
  const [finalWeight, setFinalWeight] = useState("60");
  const [pass, setPass] = useState("50");
  const [finalMin, setFinalMin] = useState("");

  const r = useMemo(() => finalNeeded(parts, finalWeight, pass, finalMin), [parts, finalWeight, pass, finalMin]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {parts.map((p, i) => (
          <div key={p.id} className="grid grid-cols-[1fr_5rem_5rem_auto] items-end gap-2">
            <Field label={i === 0 ? "Bileşen" : ""}>
              <input
                className={input}
                value={p.name}
                onChange={(e) => setParts(parts.map((x) => (x.id === p.id ? { ...x, name: e.target.value } : x)))}
              />
            </Field>
            <Field label={i === 0 ? "Etki %" : ""}>
              <input
                className={input}
                inputMode="decimal"
                value={p.weight}
                onChange={(e) => setParts(parts.map((x) => (x.id === p.id ? { ...x, weight: e.target.value } : x)))}
              />
            </Field>
            <Field label={i === 0 ? "Notun" : ""}>
              <input
                className={input}
                inputMode="decimal"
                placeholder="0-100"
                value={p.score}
                onChange={(e) => setParts(parts.map((x) => (x.id === p.id ? { ...x, score: e.target.value } : x)))}
              />
            </Field>
            <button
              type="button"
              aria-label="Kaldır"
              disabled={parts.length === 1}
              onClick={() => setParts(parts.filter((x) => x.id !== p.id))}
              className="mb-1 rounded-lg p-2 text-muted hover:text-red-400 disabled:opacity-30"
            >
              <Trash size={16} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setParts([...parts, { id: Date.now(), name: parts.length === 1 ? "Ödev / Quiz" : "Bileşen", weight: "", score: "" }])}
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          <Plus size={12} weight="bold" /> Ödev / quiz / proje ekle
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Field label="Final etkisi %">
          <input className={input} inputMode="decimal" value={finalWeight} onChange={(e) => setFinalWeight(e.target.value)} />
        </Field>
        <Field label="Geçme notu" hint="ortalama">
          <input className={input} inputMode="decimal" value={pass} onChange={(e) => setPass(e.target.value)} />
        </Field>
        <Field label="Final barajı" hint="varsa">
          <input className={input} inputMode="decimal" placeholder="ör. 50" value={finalMin} onChange={(e) => setFinalMin(e.target.value)} />
        </Field>
      </div>

      {r && Math.round(r.total) !== 100 && (
        <p className="rounded-xl border border-accent/40 bg-accent/10 px-3 py-2 text-xs text-accent">
          Etki yüzdelerinin toplamı %{r.total}. Genelde %100 olmalı — kontrol et.
        </p>
      )}

      {r ? (
        <div
          className={`rounded-2xl border p-5 text-center ${
            r.need > 100 ? "border-red-500/40 bg-red-500/10" : "border-primary/40 bg-primary/10"
          }`}
        >
          {r.need > 100 ? (
            <>
              <p className="font-heading text-2xl font-bold text-red-400">Finalden {Math.ceil(r.need)} gerekiyor 😬</p>
              <p className="mt-1 text-sm text-muted">
                100 alsan bile ortalama {(r.earned + r.fw).toFixed(1)} olur. Bütünleme / bağıl değerlendirme durumuna bak.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-muted">Geçmek için finalden en az</p>
              <p className="font-heading text-5xl font-bold text-primary tabular-nums">{Math.max(0, Math.ceil(r.need))}</p>
              <p className="mt-1 text-sm text-muted">
                almalısın. Şu ana kadar {r.earned.toFixed(1)} puan topladın.
                {!Number.isNaN(r.fmin) && r.fmin > r.rawNeed && ` (Final barajı ${r.fmin} olduğu için baraj belirleyici.)`}
              </p>
            </>
          )}
        </div>
      ) : (
        <p className="text-center text-sm text-muted">Notlarını ve yüzdeleri gir, sonucu anında görelim.</p>
      )}
    </div>
  );
}

/* ───────────── 2) Bağıl değerlendirme / çan eğrisi ───────────── */
function BellCurve() {
  const [mean, setMean] = useState("55");
  const [sd, setSd] = useState("15");
  const [score, setScore] = useState("70");

  const r = useMemo(() => relativeGrade(mean, sd, score), [mean, sd, score]);

  // Çan eğrisi SVG yolu
  const W = 320,
    H = 120;
  const path = useMemo(() => {
    const pts: string[] = [];
    for (let i = 0; i <= 80; i++) {
      const z = -3.5 + (7 * i) / 80;
      const y = Math.exp((-z * z) / 2);
      pts.push(`${(i / 80) * W},${H - 10 - y * (H - 20)}`);
    }
    return `M0,${H - 10} L${pts.join(" L")} L${W},${H - 10} Z`;
  }, []);
  const markerX = r ? Math.min(W, Math.max(0, ((r.z + 3.5) / 7) * W)) : null;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-background/40 p-4 text-sm text-muted">
        <p className="font-medium text-foreground">Bağıl not nasıl hesaplanır?</p>
        <p className="mt-1">
          Notun tek başına değil, <b>sınıfın ortalamasına ve standart sapmasına göre</b> değerlendirilir. Önce{" "}
          <b>z-skoru</b> = (notun − ortalama) ÷ standart sapma bulunur, sonra <b>T-skoru</b> = 50 + 10·z hesaplanır ve
          harf notu T-skoru aralığına göre verilir. Sınıf ortalaması düşükse aynı notla daha yüksek harf alabilirsin.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Field label="Sınıf ortalaması">
          <input className={input} inputMode="decimal" value={mean} onChange={(e) => setMean(e.target.value)} />
        </Field>
        <Field label="Standart sapma">
          <input className={input} inputMode="decimal" value={sd} onChange={(e) => setSd(e.target.value)} />
        </Field>
        <Field label="Senin notun">
          <input className={input} inputMode="decimal" value={score} onChange={(e) => setScore(e.target.value)} />
        </Field>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto h-40 w-full max-w-md" role="img" aria-label="Çan eğrisi üzerinde konumun">
        <path d={path} className="fill-primary/15 stroke-primary" strokeWidth="1.5" />
        {[-2, -1, 0, 1, 2].map((z) => (
          <g key={z}>
            <line x1={((z + 3.5) / 7) * W} x2={((z + 3.5) / 7) * W} y1={H - 10} y2={H - 4} className="stroke-muted" />
            <text x={((z + 3.5) / 7) * W} y={H} textAnchor="middle" className="fill-muted text-[8px]">
              {z === 0 ? "ort." : `${z > 0 ? "+" : ""}${z}σ`}
            </text>
          </g>
        ))}
        {markerX !== null && (
          <g>
            <line x1={markerX} x2={markerX} y1={8} y2={H - 10} className="stroke-accent" strokeWidth="2" strokeDasharray="3 2" />
            <circle cx={markerX} cy={8} r={4} className="fill-accent" />
          </g>
        )}
      </svg>

      {r && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            ["z-skoru", r.z.toFixed(2)],
            ["T-skoru", r.t.toFixed(1)],
            ["Sınıfın", `%${Math.round(r.pct)}'inden iyi`],
            ["Tahmini harf", r.letter],
          ].map(([l, v]) => (
            <div key={l} className="rounded-xl border border-border bg-card p-3 text-center">
              <div className="text-xs text-muted">{l}</div>
              <div className="mt-0.5 font-heading text-lg font-bold text-foreground">{v}</div>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-muted">
        ⚠️ Harf aralıkları ve mutlak/bağıl sınırları üniversiteden üniversiteye değişir; kendi yönetmeliğine bak. Bu
        tahmin yaygın T-skoru tablosuna göredir.
      </p>
    </div>
  );
}

/* ───────────── 3) Ortalama (AGNO) ───────────── */
type Row = { id: number; name: string; credit: string; letter: string };

function GpaCalc() {
  const [rows, setRows] = useState<Row[]>([
    { id: 1, name: "", credit: "", letter: "BB" },
    { id: 2, name: "", credit: "", letter: "CB" },
  ]);
  const [prevGpa, setPrevGpa] = useState("");
  const [prevCredit, setPrevCredit] = useState("");

  const r = useMemo(() => gpa(rows, prevGpa, prevCredit), [rows, prevGpa, prevCredit]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {rows.map((row, i) => (
          <div key={row.id} className="grid grid-cols-[1fr_5rem_6.5rem_auto] items-end gap-2">
            <Field label={i === 0 ? "Ders" : ""}>
              <input
                className={input}
                placeholder={`Ders ${i + 1}`}
                value={row.name}
                onChange={(e) => setRows(rows.map((x) => (x.id === row.id ? { ...x, name: e.target.value } : x)))}
              />
            </Field>
            <Field label={i === 0 ? "Kredi/AKTS" : ""}>
              <input
                className={input}
                inputMode="decimal"
                value={row.credit}
                onChange={(e) => setRows(rows.map((x) => (x.id === row.id ? { ...x, credit: e.target.value } : x)))}
              />
            </Field>
            <Field label={i === 0 ? "Harf" : ""}>
              <Combobox
                searchPlaceholder="Harf ara..."
                options={LETTERS.map(([l, v]) => ({ value: l, label: l, hint: String(v) }))}
                value={row.letter}
                onChange={(v) => setRows(rows.map((x) => (x.id === row.id ? { ...x, letter: v || "BB" } : x)))}
              />
            </Field>
            <button
              type="button"
              aria-label="Kaldır"
              disabled={rows.length === 1}
              onClick={() => setRows(rows.filter((x) => x.id !== row.id))}
              className="mb-1 rounded-lg p-2 text-muted hover:text-red-400 disabled:opacity-30"
            >
              <Trash size={16} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setRows([...rows, { id: Date.now(), name: "", credit: "", letter: "BB" }])}
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          <Plus size={12} weight="bold" /> Ders ekle
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Önceki AGNO" hint="opsiyonel">
          <input className={input} inputMode="decimal" placeholder="ör. 2.85" value={prevGpa} onChange={(e) => setPrevGpa(e.target.value)} />
        </Field>
        <Field label="Önceki toplam kredi" hint="opsiyonel">
          <input className={input} inputMode="decimal" placeholder="ör. 120" value={prevCredit} onChange={(e) => setPrevCredit(e.target.value)} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-primary/40 bg-primary/10 p-4 text-center">
          <div className="text-xs text-muted">Dönem ortalaması (YANO)</div>
          <div className="font-heading text-3xl font-bold tabular-nums text-primary">{r.term?.toFixed(2) ?? "—"}</div>
          <div className="text-xs text-muted">{r.credits} kredi</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 text-center">
          <div className="text-xs text-muted">Genel ortalama (AGNO)</div>
          <div className="font-heading text-3xl font-bold tabular-nums text-foreground">{r.cum?.toFixed(2) ?? "—"}</div>
          <div className="text-xs text-muted">{r.cum ? "önceki dönemlerle" : "önceki AGNO'yu gir"}</div>
        </div>
      </div>
      <p className="text-xs text-muted">Hesap: Σ(kredi × katsayı) ÷ Σ kredi. Katsayılar 4&apos;lük sistem (AA=4 … FF=0).</p>
    </div>
  );
}

const TABS = [
  { key: "final", label: "Finalden kaç lazım?", icon: Calculator, C: FinalNeeded },
  { key: "bagil", label: "Bağıl not / çan eğrisi", icon: ChartLine, C: BellCurve },
  { key: "agno", label: "Ortalama (AGNO)", icon: Student, C: GpaCalc },
] as const;

export function GradeCalculator() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("final");
  const Active = TABS.find((t) => t.key === tab)!.C;
  return (
    <div className="space-y-5">
      <div className="flex gap-1 overflow-x-auto rounded-2xl border border-border bg-card p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-sm transition ${
              tab === t.key ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground"
            }`}
          >
            <t.icon size={16} weight={tab === t.key ? "fill" : "regular"} /> {t.label}
          </button>
        ))}
      </div>
      <div className="rounded-2xl border border-border bg-card/50 p-5">
        <Active />
      </div>
    </div>
  );
}
