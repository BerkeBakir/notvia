"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { CaretDown, Check, MagnifyingGlass, Plus, X } from "@phosphor-icons/react";

export interface ComboOption {
  value: string;
  label: string;
  /** Sağda soluk gösterilen ek bilgi (ör. şehir) */
  hint?: string;
}

// Türkçe büyük/küçük harf + aksan duyarsız arama ("ODTU" → "Orta Doğu Teknik", "istanbul" → "İstanbul")
function norm(s: string) {
  return s
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ı/g, "i");
}

/** Aranabilir seçim kutusu: klasik <select> yerine. Klavye (↑↓ Enter Esc) destekli. */
export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Seç",
  searchPlaceholder = "Ara...",
  disabled = false,
  emptyText = "Sonuç yok",
  createLabel,
  onCreate,
  clearable = false,
  icon,
}: {
  options: ComboOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  emptyText?: string;
  /** Verilirse listenin sonunda "+ ..." satırı çıkar; arama metni onCreate'e gider */
  createLabel?: string;
  onCreate?: (query: string) => void;
  clearable?: boolean;
  icon?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  const selected = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    const q = norm(query.trim());
    if (!q) return options;
    // Baştan eşleşenler önce
    const starts: ComboOption[] = [];
    const contains: ComboOption[] = [];
    for (const o of options) {
      const l = norm(o.label + " " + (o.hint ?? ""));
      const words = norm(o.label).split(/[\s-]+/).filter(Boolean);
      // Kısaltma: "odtu" → Orta Doğu Teknik Üniversitesi, "itu" → İstanbul Teknik Üniversitesi
      const initials = words.map((w) => w[0]).join("");
      if (l.startsWith(q) || words.some((w) => w.startsWith(q)) || initials.startsWith(q)) starts.push(o);
      else if (l.includes(q)) contains.push(o);
    }
    return [...starts, ...contains];
  }, [options, query]);

  const showCreate = !!onCreate && !!createLabel;
  const itemCount = filtered.length + (showCreate ? 1 : 0);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery("");
      const i = options.findIndex((o) => o.value === value);
      setActive(i >= 0 ? i : 0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-idx="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function pick(i: number) {
    if (i < filtered.length) {
      onChange(filtered[i].value);
      setOpen(false);
    } else if (showCreate) {
      onCreate!(query.trim());
      setOpen(false);
    }
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, itemCount - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (itemCount) pick(active);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`group flex w-full items-center gap-3 rounded-xl border bg-card px-4 py-3 text-left text-sm transition ${
          open ? "border-primary ring-4 ring-primary/10" : "border-border hover:border-primary/50"
        } disabled:cursor-not-allowed disabled:opacity-50`}
      >
        {icon && <span className="text-primary">{icon}</span>}
        <span className={`min-w-0 flex-1 truncate ${selected ? "text-foreground" : "text-muted"}`}>
          {selected ? selected.label : placeholder}
          {selected?.hint && <span className="ml-2 text-xs text-muted">{selected.hint}</span>}
        </span>
        {clearable && selected && !disabled ? (
          <span
            role="button"
            tabIndex={-1}
            aria-label="Temizle"
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
            }}
            className="rounded p-0.5 text-muted hover:text-foreground"
          >
            <X size={14} />
          </span>
        ) : (
          <CaretDown size={16} className={`text-muted transition ${open ? "rotate-180" : ""}`} />
        )}
      </button>

      {open && (
        <div className="animate-fade-up absolute z-40 mt-2 w-full overflow-hidden rounded-xl border border-border bg-card shadow-2xl shadow-black/20">
          <div className="flex items-center gap-2 border-b border-border px-3">
            <MagnifyingGlass size={16} className="text-muted" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={onKey}
              placeholder={searchPlaceholder}
              role="combobox"
              aria-controls={listId}
              aria-expanded
              style={{ outline: "none" }}
              className="w-full border-0 bg-transparent py-3 text-sm text-foreground shadow-none outline-none ring-0 placeholder:text-muted focus:ring-0 focus-visible:outline-none"
            />
          </div>
          <ul ref={listRef} id={listId} role="listbox" className="max-h-72 overflow-y-auto p-1.5">
            {filtered.map((o, i) => (
              <li
                key={o.value}
                data-idx={i}
                role="option"
                aria-selected={o.value === value}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(i);
                }}
                className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-sm ${
                  i === active ? "bg-primary/10 text-primary" : "text-foreground"
                }`}
              >
                <span className="min-w-0 flex-1 truncate">{o.label}</span>
                {o.hint && <span className="shrink-0 text-xs text-muted">{o.hint}</span>}
                {o.value === value && <Check size={16} weight="bold" className="shrink-0 text-primary" />}
              </li>
            ))}
            {!filtered.length && !showCreate && (
              <li className="px-3 py-6 text-center text-sm text-muted">{emptyText}</li>
            )}
            {showCreate && (
              <li
                data-idx={filtered.length}
                role="option"
                aria-selected={false}
                onMouseEnter={() => setActive(filtered.length)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(filtered.length);
                }}
                className={`mt-1 flex cursor-pointer items-center gap-2 rounded-lg border-t border-border px-3 py-2.5 text-sm font-medium ${
                  active === filtered.length ? "bg-primary/10 text-primary" : "text-primary"
                }`}
              >
                <Plus size={16} weight="bold" />
                {query.trim() ? `"${query.trim()}" — ${createLabel}` : createLabel}
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
