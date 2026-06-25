"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

const OPTIONS = [
  { value: "light", label: "Aydınlık", icon: "☀️" },
  { value: "dark", label: "Karanlık", icon: "🌙" },
  { value: "notvia", label: "Notvia", icon: "✨" },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-9 w-[120px] rounded-full border border-border" />;
  }

  return (
    <div className="flex items-center gap-0.5 rounded-full border border-border bg-card p-0.5">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setTheme(opt.value)}
          title={opt.label}
          aria-label={opt.label}
          className={
            theme === opt.value
              ? "rounded-full bg-primary px-2.5 py-1 text-sm text-primary-foreground"
              : "rounded-full px-2.5 py-1 text-sm text-muted hover:text-foreground"
          }
        >
          {opt.icon}
        </button>
      ))}
    </div>
  );
}
