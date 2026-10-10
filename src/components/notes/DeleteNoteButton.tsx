"use client";

import { useActionState, useState } from "react";
import { Trash } from "@phosphor-icons/react";
import { deleteMyNote } from "@/lib/actions/notes";
import { OWNER_DELETE_REASONS } from "@/lib/notes/remove";

/** Not sahibine görünür: sebep seçip notu kalıcı olarak siler. */
export function DeleteNoteButton({ noteId }: { noteId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [state, action, pending] = useActionState(deleteMyNote, null);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1 text-xs text-muted hover:text-red-400">
        <Trash size={13} /> Notu sil
      </button>
    );
  }

  return (
    <form action={action} className="space-y-3 rounded-xl border border-red-500/30 bg-red-500/5 p-4">
      <input type="hidden" name="noteId" value={noteId} />
      <p className="text-sm font-medium text-foreground">Notu neden siliyorsun?</p>
      <div className="space-y-1.5">
        {Object.entries(OWNER_DELETE_REASONS).map(([k, label]) => (
          <label key={k} className="flex items-center gap-2 text-sm text-foreground">
            <input type="radio" name="reason" value={k} checked={reason === k} onChange={() => setReason(k)} />
            {label}
          </label>
        ))}
      </div>
      <textarea
        name="detail"
        maxLength={500}
        rows={2}
        required={reason === "diger"}
        placeholder={reason === "diger" ? "Kısaca sebebini yaz" : "Eklemek istediğin bir şey var mı? (isteğe bağlı)"}
        className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted focus:border-primary"
      />
      <p className="text-xs text-muted">
        PDF, yorumlar ve beğeniler kalıcı olarak silinir; bu notun katkı puanları da düşer. Geri alınamaz.
      </p>
      {state && !state.ok && <p className="text-sm text-red-400">{state.message}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!reason || pending}
          className="rounded-full bg-red-500 px-4 py-1.5 text-sm text-white disabled:opacity-50"
        >
          {pending ? "Siliniyor…" : "Kalıcı olarak sil"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-muted hover:text-foreground">
          Vazgeç
        </button>
      </div>
    </form>
  );
}
