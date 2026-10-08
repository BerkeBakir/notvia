"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export interface CommentItem {
  id: string;
  content: string;
  created_at: string;
  authorId: string;
  authorName: string;
}

export function CommentSection({
  noteId,
  userId,
  userName,
  initialComments,
}: {
  noteId: string;
  userId: string | null;
  userName: string;
  initialComments: CommentItem[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [comments, setComments] = useState(initialComments);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) {
      router.push("/login");
      return;
    }
    if (!text.trim()) return;
    setLoading(true);
    setError("");

    const { data, error: insErr } = await supabase
      .from("comments")
      .insert({ note_id: noteId, user_id: userId, content: text.trim() })
      .select("id, content, created_at")
      .single();

    if (insErr || !data) {
      setError("Yorum eklenemedi.");
      setLoading(false);
      return;
    }

    setComments((prev) => [
      { ...data, authorId: userId, authorName: userName },
      ...prev,
    ]);
    setText("");
    setLoading(false);
  }

  return (
    <section className="space-y-4">
      <h2 className="font-heading text-xl text-foreground">
        Yorumlar ({comments.length})
      </h2>

      <form onSubmit={submit} className="space-y-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder={
            userId ? "Bir yorum yaz..." : "Yorum yapmak için giriş yap"
          }
          className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-primary"
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Gönderiliyor..." : "Yorum Yap"}
        </button>
      </form>

      <ul className="space-y-3">
        {comments.length === 0 && (
          <li className="text-sm text-muted">Henüz yorum yok. İlk yorumu sen yap.</li>
        )}
        {comments.map((c) => (
          <li
            key={c.id}
            className="rounded-lg border border-border bg-card p-4"
          >
            <div className="flex items-center justify-between">
              <Link
                href={`/users/${c.authorId}`}
                className="text-sm font-medium text-foreground hover:text-primary hover:underline"
              >
                {c.authorName}
              </Link>
              <span className="text-xs text-muted">
                {new Date(c.created_at).toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul" })}
              </span>
            </div>
            <p className="mt-1 whitespace-pre-wrap text-sm text-muted">
              {c.content}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
