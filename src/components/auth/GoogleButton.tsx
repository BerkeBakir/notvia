"use client";

import { createClient } from "@/lib/supabase/client";

export function GoogleButton() {
  const supabase = createClient();

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
  }

  return (
    <button
      type="button"
      onClick={signInWithGoogle}
      className="w-full rounded-lg border border-border px-4 py-3 font-medium text-foreground hover:border-primary hover:text-primary"
    >
      Google ile Devam Et
    </button>
  );
}
