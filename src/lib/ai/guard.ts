import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth";

interface GuardOk {
  note: { id: string; title: string; file_url: string };
  error?: undefined;
}
interface GuardErr {
  note?: undefined;
  error: NextResponse;
}

/** Pro üye + geçerli not kontrolü. Hata varsa error döner. */
export async function proNoteGuard(
  noteId: string | undefined,
): Promise<GuardOk | GuardErr> {
  const user = await getCurrentUser();
  if (!user)
    return { error: NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 }) };
  if (user.plan !== "pro")
    return {
      error: NextResponse.json(
        { error: "Bu özellik yalnızca Pro üyelere açıktır." },
        { status: 403 },
      ),
    };
  if (!noteId)
    return { error: NextResponse.json({ error: "noteId gerekli." }, { status: 400 }) };

  const supabase = await createClient();
  const { data: note } = await supabase
    .from("notes")
    .select("id,title,file_url")
    .eq("id", noteId)
    .single();
  if (!note)
    return { error: NextResponse.json({ error: "Not bulunamadı." }, { status: 404 }) };

  return { note };
}
