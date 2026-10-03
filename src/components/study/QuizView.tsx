"use client";

import { useState } from "react";
import { CheckCircle, XCircle, ArrowCounterClockwise } from "@phosphor-icons/react";
import type { QuizQuestion } from "@/lib/ai/studio";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

/** İnteraktif quiz: şıkka tıkla → anında doğru/yanlış + açıklama; sonda skor. */
export function QuizView({ questions }: { questions: QuizQuestion[] }) {
  const [picked, setPicked] = useState<(number | null)[]>(() => questions.map(() => null));
  const answered = picked.filter((p) => p !== null).length;
  const correct = picked.filter((p, i) => p === questions[i].answer).length;
  const done = answered === questions.length;

  return (
    <div className="space-y-5">
      <div className="sticky -top-4 z-10 -mx-5 -mt-4 border-b border-border bg-card/95 px-5 py-3 backdrop-blur">
        <div className="flex items-center justify-between text-xs text-muted">
          <span>
            {answered}/{questions.length} cevaplandı
          </span>
          <span className="font-semibold text-primary">
            Skor: {correct}/{questions.length}
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-foreground/10">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${(answered / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {questions.map((q, qi) => {
        const p = picked[qi];
        return (
          <div key={qi} className="rounded-2xl border border-border p-4">
            <p className="font-medium text-foreground">
              <span className="mr-1.5 text-primary">{qi + 1}.</span>
              {q.q}
            </p>
            <div className="mt-3 space-y-2">
              {q.options.map((opt, oi) => {
                const isAnswer = oi === q.answer;
                const isPicked = oi === p;
                let cls = "border-border hover:border-primary hover:bg-primary/5";
                if (p !== null) {
                  if (isAnswer) cls = "border-emerald-500/60 bg-emerald-500/10 text-foreground";
                  else if (isPicked) cls = "border-red-400/60 bg-red-400/10 text-foreground";
                  else cls = "border-border opacity-60";
                }
                return (
                  <button
                    key={oi}
                    type="button"
                    disabled={p !== null}
                    onClick={() => setPicked((arr) => arr.map((x, i) => (i === qi ? oi : x)))}
                    className={`flex w-full items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm transition ${cls}`}
                  >
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-current text-[10px] font-semibold">
                      {LETTERS[oi]}
                    </span>
                    <span className="flex-1">{opt}</span>
                    {p !== null && isAnswer && <CheckCircle size={18} weight="fill" className="shrink-0 text-emerald-500" />}
                    {p !== null && isPicked && !isAnswer && <XCircle size={18} weight="fill" className="shrink-0 text-red-400" />}
                  </button>
                );
              })}
            </div>
            {p !== null && q.explanation && (
              <p className="mt-3 rounded-lg bg-foreground/5 px-3 py-2 text-xs leading-relaxed text-muted">
                <span className="font-semibold text-foreground">{p === q.answer ? "Doğru! " : "Açıklama: "}</span>
                {q.explanation}
              </p>
            )}
          </div>
        );
      })}

      {done && (
        <div className="rounded-2xl border border-primary/40 bg-primary/5 p-5 text-center">
          <p className="font-heading text-2xl font-bold text-primary">
            {correct}/{questions.length}
          </p>
          <p className="mt-1 text-sm text-muted">
            {correct === questions.length
              ? "Mükemmel, hepsi doğru!"
              : correct >= questions.length * 0.7
                ? "Gayet iyi, yanlışların açıklamalarına göz at."
                : "Biraz daha tekrar iyi olur; açıklamaları oku ve tekrar dene."}
          </p>
          <button
            type="button"
            onClick={() => setPicked(questions.map(() => null))}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-1.5 text-xs font-medium text-foreground hover:border-primary hover:text-primary"
          >
            <ArrowCounterClockwise size={14} /> Yeniden çöz
          </button>
        </div>
      )}
    </div>
  );
}
