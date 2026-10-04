-- Fonksiyon güvenliği (advisor sonrası): /rpc/ ile doğrudan çağrıyı engelle + search_path sabitle.
-- Bu fonksiyonlar yalnızca service_role (sunucu) veya trigger olarak kullanılır.
-- (increment_download hariç — indirme butonu client ile çağırır.)

revoke execute on function public.consume_ai_quota(uuid, integer) from public, anon, authenticated;
revoke execute on function public.refund_ai_quota(uuid) from public, anon, authenticated;
revoke execute on function public.match_note_chunks(vector, integer, uuid) from public, anon, authenticated;
revoke execute on function public.match_note_chunks_v2(vector, integer, uuid, uuid[]) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.notify_on_comment() from public, anon, authenticated;
revoke execute on function public.notify_on_like() from public, anon, authenticated;
revoke execute on function public.notify_on_note() from public, anon, authenticated;
revoke execute on function public.sync_note_dislikes() from public, anon, authenticated;
revoke execute on function public.sync_note_likes() from public, anon, authenticated;
revoke execute on function public.check_course_verification() from public, anon, authenticated;

grant execute on function public.consume_ai_quota(uuid, integer) to service_role;
grant execute on function public.refund_ai_quota(uuid) to service_role;
grant execute on function public.match_note_chunks(vector, integer, uuid) to service_role;
grant execute on function public.match_note_chunks_v2(vector, integer, uuid, uuid[]) to service_role;

alter function public.consume_ai_quota(uuid, integer) set search_path = public, pg_temp;
alter function public.refund_ai_quota(uuid) set search_path = public, pg_temp;
alter function public.match_note_chunks(vector, integer, uuid) set search_path = public, pg_temp;
alter function public.match_note_chunks_v2(vector, integer, uuid, uuid[]) set search_path = public, pg_temp;
alter function public.handle_new_user() set search_path = public, pg_temp;
alter function public.notify_on_comment() set search_path = public, pg_temp;
alter function public.notify_on_like() set search_path = public, pg_temp;
alter function public.notify_on_note() set search_path = public, pg_temp;
alter function public.sync_note_dislikes() set search_path = public, pg_temp;
alter function public.sync_note_likes() set search_path = public, pg_temp;
alter function public.check_course_verification() set search_path = public, pg_temp;
alter function public.increment_download(uuid) set search_path = public, pg_temp;
