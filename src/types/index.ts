export type Plan = "free" | "premium" | "pro";

export type Role = "guest" | "member" | "premium" | "moderator" | "admin";

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  university?: string;
  department?: string;
  plan: Plan;
  role: Role;
  createdAt: string;
}

export interface University {
  id: string;
  name: string;
  city: string;
}

export interface Department {
  id: string;
  universityId: string;
  name: string;
}

export type NoteType = "note" | "exam";

export interface Note {
  id: string;
  userId: string;
  title: string;
  description?: string;
  fileUrl: string;
  type: NoteType;
  tags: string[];
  downloads: number;
  likes: number;
  dislikes: number;
  createdAt: string;
}

export interface Comment {
  id: string;
  noteId: string;
  userId: string;
  content: string;
  createdAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  plan: Plan;
  startDate: string;
  endDate: string;
  paymentId: string;
}
