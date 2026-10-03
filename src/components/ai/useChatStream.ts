"use client";

import { useState } from "react";

export interface ChatMsg {
  role: "user" | "assistant";
  content: string;
  sources?: { noteId: string }[];
  /** Yanıtı üreten sağlayıcı/model (yalnızca canlı akışta bilinir). */
  provider?: { provider: string; model: string };
}

export interface ChatScope {
  type: "all" | "course";
  courseId?: string | null;
}

/**
 * /api/ai/chat SSE akışını tüketen paylaşılan sohbet mantığı.
 * Hem tam sayfa asistan hem ders sayfası asistanı bunu kullanır (DRY).
 */
export function useChatStream() {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [showUpsell, setShowUpsell] = useState(false);
  const [conversationId, setConversationId] = useState("");

  async function send(
    message: string,
    scope: ChatScope,
    onNewConversation?: (id: string, title: string) => void,
  ) {
    const text = message.trim();
    if (!text || loading) return;
    const isNew = !conversationId;
    setNotice("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          conversationId: conversationId || undefined,
          scopeType: scope.type,
          scopeCourseId: scope.type === "course" ? scope.courseId : null,
          message: text,
        }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 429 || data.limitReached) setShowUpsell(true);
        else setNotice(data.error ?? "Hata oluştu.");
        setMessages((m) => m.slice(0, -1));
        setLoading(false);
        return;
      }

      setMessages((m) => [...m, { role: "assistant", content: "" }]);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let streamErr = "";

      const handle = (evt: Record<string, unknown>) => {
        if (evt.type === "meta") {
          if (typeof evt.conversationId === "string") {
            setConversationId(evt.conversationId);
            if (isNew) onNewConversation?.(evt.conversationId, text.slice(0, 60));
          }
          const srcs = evt.sources as { noteId: string }[] | undefined;
          setMessages((m) => {
            const copy = [...m];
            copy[copy.length - 1] = { ...copy[copy.length - 1], sources: srcs };
            return copy;
          });
          if (evt.remaining !== null && evt.remaining !== undefined) {
            setNotice(`Bugün kalan ücretsiz soru: ${evt.remaining}`);
          }
        } else if (evt.type === "provider") {
          const provider = { provider: String(evt.provider ?? ""), model: String(evt.model ?? "") };
          setMessages((m) => {
            const copy = [...m];
            copy[copy.length - 1] = { ...copy[copy.length - 1], provider };
            return copy;
          });
        } else if (evt.type === "delta") {
          const t = String(evt.text ?? "");
          setMessages((m) => {
            const copy = [...m];
            const last = copy[copy.length - 1];
            copy[copy.length - 1] = { ...last, content: last.content + t };
            return copy;
          });
        } else if (evt.type === "error") {
          streamErr = String(evt.error ?? "Hata oluştu.");
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const frames = buf.split("\n\n");
        buf = frames.pop() ?? "";
        for (const frame of frames) {
          const line = frame.trim();
          if (!line.startsWith("data:")) continue;
          try {
            handle(JSON.parse(line.slice(5).trim()));
          } catch {
            // parçalı frame
          }
        }
      }

      if (streamErr) {
        setNotice(streamErr);
        setMessages((m) =>
          m[m.length - 1]?.role === "assistant" && !m[m.length - 1].content ? m.slice(0, -1) : m,
        );
      }
    } catch {
      setNotice("Bağlantı hatası.");
      setMessages((m) => m.slice(0, -1));
    }
    setLoading(false);
  }

  return {
    messages,
    setMessages,
    loading,
    notice,
    setNotice,
    showUpsell,
    setShowUpsell,
    conversationId,
    setConversationId,
    send,
  };
}
