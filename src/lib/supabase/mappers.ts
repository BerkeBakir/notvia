import type { Note } from "@/types";

export interface NoteRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  file_url: string;
  type: "note" | "exam";
  downloads: number;
  likes: number;
  dislikes: number | null;
  created_at: string;
}

export function mapNoteRow(row: NoteRow): Note {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description ?? undefined,
    fileUrl: row.file_url,
    type: row.type,
    tags: [],
    downloads: row.downloads,
    likes: row.likes,
    dislikes: row.dislikes ?? 0,
    createdAt: row.created_at,
  };
}
