// src/components/ai/Markdown.tsx
// AI yanıtları için hafif, güvenli markdown görüntüleyici (HTML enjekte etmez).
// Desteklenen: başlıklar, kalın/italik, satır içi kod, kod bloğu, madde/numaralı liste,
// alıntı, yatay çizgi. Akış sırasında yarım kalan işaretler düz metin olarak görünür.
// cite verilirse [1] / [2, 5] biçimindeki kaynak atıfları o fonksiyonla çizilir.
import { Fragment, type ReactNode } from "react";

type Cite = (nums: number[], key: string) => ReactNode;

function inline(text: string, keyBase: string, cite?: Cite): ReactNode[] {
  const out: ReactNode[] = [];
  // **kalın**, __kalın__, *italik*, _italik_, `kod`, [1, 2] atıf
  const re = /(\*\*([^*]+)\*\*|__([^_]+)__|`([^`]+)`|\*([^*\s][^*]*)\*|(?<![\p{L}\d])_([^_\s][^_]*)_(?![\p{L}\d])|\[(\d{1,2}(?:\s*,\s*\d{1,2})*)\])/gu;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const k = `${keyBase}-${i++}`;
    if (m[7]) {
      out.push(cite ? cite(m[7].split(",").map((x) => Number(x.trim())), k) : m[0]);
    } else if (m[2] ?? m[3]) out.push(<strong key={k} className="font-semibold">{inline(m[2] ?? m[3], k, cite)}</strong>);
    else if (m[4]) out.push(<code key={k} className="rounded bg-foreground/10 px-1 py-0.5 font-mono text-[0.85em]">{m[4]}</code>);
    else out.push(<em key={k}>{inline(m[5] ?? m[6], k, cite)}</em>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

type Block =
  | { t: "h"; level: number; text: string }
  | { t: "p"; text: string }
  | { t: "ul" | "ol"; items: { text: string; depth: number; n?: string }[] }
  | { t: "code"; text: string }
  | { t: "quote"; text: string }
  | { t: "hr" };

function parse(src: string): Block[] {
  const lines = src.replace(/\r/g, "").split("\n");
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) { i++; continue; }

    if (trimmed.startsWith("```")) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) buf.push(lines[i++]);
      i++;
      blocks.push({ t: "code", text: buf.join("\n") });
      continue;
    }
    const h = /^(#{1,6})\s+(.*)$/.exec(trimmed);
    if (h) { blocks.push({ t: "h", level: h[1].length, text: h[2].replace(/#+$/, "").trim() }); i++; continue; }
    if (/^([-*_])(\s*\1){2,}$/.test(trimmed)) { blocks.push({ t: "hr" }); i++; continue; }

    const listRe = /^(\s*)([-*•–]|\d+[.)])\s+(.*)$/;
    const lm = listRe.exec(line);
    if (lm) {
      const ordered = /\d/.test(lm[2]);
      const items: { text: string; depth: number; n?: string }[] = [];
      while (i < lines.length) {
        const cur = listRe.exec(lines[i]);
        if (cur && /\d/.test(cur[2]) === ordered) {
          items.push({
            text: cur[3],
            depth: Math.min(Math.floor(cur[1].replace(/\t/g, "  ").length / 2), 3),
            n: ordered ? cur[2].replace(")", ".") : undefined,
          });
          i++;
        } else if (cur) {
          // farklı türde alt liste: girintili ise aynı listeye alt madde olarak ekle
          if (cur[1].length > 0) { items.push({ text: cur[3], depth: Math.min(Math.floor(cur[1].length / 2), 3) || 1 }); i++; }
          else break;
        } else if (!lines[i].trim()) {
          // boş satır: sonraki dolu satır aynı listenin devamıysa listeyi bölme
          let j = i;
          while (j < lines.length && !lines[j].trim()) j++;
          const nxt = j < lines.length ? listRe.exec(lines[j]) : null;
          if (nxt && /\d/.test(nxt[2]) === ordered) i = j;
          else break;
        } else if (/^\s{2,}/.test(lines[i]) && items.length) {
          items[items.length - 1].text += " " + lines[i].trim();
          i++;
        } else break;
      }
      blocks.push({ t: ordered ? "ol" : "ul", items });
      continue;
    }
    if (trimmed.startsWith(">")) {
      const buf: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) buf.push(lines[i++].trim().replace(/^>\s?/, ""));
      blocks.push({ t: "quote", text: buf.join("\n") });
      continue;
    }
    const buf: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,6}\s|```|>)/.test(lines[i].trim()) &&
      !listRe.test(lines[i])
    ) buf.push(lines[i++].trim());
    blocks.push({ t: "p", text: buf.join("\n") });
  }
  return blocks;
}

function withBreaks(text: string, key: string, cite?: Cite): ReactNode[] {
  return text.split("\n").map((l, j, arr) => (
    <Fragment key={`${key}-l${j}`}>
      {inline(l, `${key}-l${j}`, cite)}
      {j < arr.length - 1 && <br />}
    </Fragment>
  ));
}

const H_CLASS = ["", "text-lg", "text-base", "text-[0.95rem]", "text-sm", "text-sm", "text-sm"];

export function Markdown({ text, cite }: { text: string; cite?: Cite }) {
  const blocks = parse(text);
  return (
    <div className="space-y-2.5 leading-relaxed break-words">
      {blocks.map((b, i) => {
        const k = `b${i}`;
        switch (b.t) {
          case "h":
            return (
              <p key={k} className={`${H_CLASS[b.level]} mt-3 font-heading font-bold first:mt-0`}>
                {inline(b.text, k, cite)}
              </p>
            );
          case "hr":
            return <hr key={k} className="border-border" />;
          case "code":
            return (
              <pre key={k} className="overflow-x-auto rounded-lg bg-foreground/5 p-3 font-mono text-xs">
                {b.text}
              </pre>
            );
          case "quote":
            return (
              <blockquote key={k} className="border-l-2 border-primary/50 pl-3 text-muted">
                {withBreaks(b.text, k, cite)}
              </blockquote>
            );
          case "ul":
          case "ol":
            return (
              <div key={k} className="space-y-1.5">
                {b.items.map((it, j) => (
                  <div key={j} className="flex gap-2" style={{ paddingLeft: `${it.depth * 1.1}rem` }}>
                    <span className="shrink-0 select-none text-primary">
                      {it.n ?? (it.depth === 0 ? "•" : "◦")}
                    </span>
                    <span className="min-w-0">{inline(it.text, `${k}-${j}`, cite)}</span>
                  </div>
                ))}
              </div>
            );
          default:
            return <p key={k}>{withBreaks(b.text, k, cite)}</p>;
        }
      })}
    </div>
  );
}
