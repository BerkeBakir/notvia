import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase istemcisi (yalnızca sunucu tarafında!).
 * RLS'i bypass eder — abonelerin e-postalarını okumak için gerekli.
 * Anahtar yoksa null döner (e-posta yapılandırılmadıysa uygulama bozulmaz).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
