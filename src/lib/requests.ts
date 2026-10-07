import type { SupabaseClient } from "@supabase/supabase-js";
import type { RequestItem } from "@/components/requests/RequestBoard";

/** Not isteklerini oy sayıları, kullanıcının oyu ve isteyen adlarıyla yükler. */
export async function loadRequests(
  supabase: SupabaseClient,
  opts: { courseId?: string; courseIds?: string[]; userId: string | null; limit?: number; withCourseLabel?: boolean },
): Promise<RequestItem[]> {
  let q = supabase
    .from("note_requests")
    .select("id,title,detail,status,user_id,course_id,fulfilled_note_id,created_at")
    .in("status", ["open", "fulfilled"])
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 50);
  if (opts.courseId) q = q.eq("course_id", opts.courseId);
  if (opts.courseIds) q = q.in("course_id", opts.courseIds.length ? opts.courseIds : ["00000000-0000-0000-0000-000000000000"]);
  const { data: rows } = await q;
  const reqs = rows ?? [];
  if (!reqs.length) return [];

  const ids = reqs.map((r) => r.id);
  const userIds = [...new Set(reqs.map((r) => r.user_id))];
  const [{ data: votes }, { data: users }] = await Promise.all([
    supabase.from("note_request_votes").select("request_id,user_id").in("request_id", ids),
    supabase.from("users").select("id,name").in("id", userIds),
  ]);
  const nameOf = new Map((users ?? []).map((u) => [u.id, u.name as string]));

  let label = new Map<string, string>();
  if (opts.withCourseLabel) {
    const cids = [...new Set(reqs.map((r) => r.course_id))];
    const { data: courses } = await supabase.from("courses").select("id,name,department_id").in("id", cids);
    const dids = [...new Set((courses ?? []).map((c) => c.department_id))];
    const { data: deps } = await supabase.from("departments").select("id,university_id").in("id", dids);
    const uids = [...new Set((deps ?? []).map((d) => d.university_id))];
    const { data: unis } = await supabase.from("universities").select("id,name").in("id", uids);
    const uniOfDep = new Map((deps ?? []).map((d) => [d.id, d.university_id]));
    const uniName = new Map((unis ?? []).map((u) => [u.id, u.name as string]));
    label = new Map(
      (courses ?? []).map((c) => [c.id, `${c.name} · ${uniName.get(uniOfDep.get(c.department_id) ?? "") ?? ""}`]),
    );
  }

  return reqs.map((r) => {
    const vs = (votes ?? []).filter((v) => v.request_id === r.id);
    return {
      ...(r as Omit<RequestItem, "votes" | "voted">),
      votes: vs.length,
      voted: !!opts.userId && vs.some((v) => v.user_id === opts.userId),
      requesterName: r.user_id === opts.userId ? "Sen" : nameOf.get(r.user_id),
      courseLabel: label.get(r.course_id),
    };
  });
}
