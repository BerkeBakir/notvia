"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, BookOpen, Lightning } from "@phosphor-icons/react";

const OPTIONS = [
  { value: "light", label: "Aydınlık", Icon: Sun },
  { value: "dark", label: "Karanlık", Icon: Moon },
  { value: "editorial", label: "Sıcak editöryel", Icon: BookOpen },
  { value: "contrast", label: "Yüksek kontrast", Icon: Lightning },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-9 w-[148px] rounded-full border border-border" />;
  }

  return (
    <div className="flex items-center gap-0.5 rounded-full border border-border bg-card p-0.5">
      {OPTIONS.map((opt) => {
        const active = theme === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => setTheme(opt.value)}
            title={opt.label}
            aria-label={opt.label}
            aria-pressed={active}
            className={
              active
                ? "grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground"
                : "grid h-7 w-7 place-items-center rounded-full text-muted transition hover:text-foreground"
            }
          >
            <opt.Icon size={16} weight={active ? "fill" : "regular"} />
          </button>
        );
      })}
    </div>
  );
}
