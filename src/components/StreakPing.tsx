"use client";

import { useEffect } from "react";
import { touchStreak } from "@/lib/actions/streak";

/** Giriş yapmış kullanıcı için günlük çalışma serisini (sessizce) günceller. */
export function StreakPing() {
  useEffect(() => {
    void touchStreak();
  }, []);
  return null;
}
