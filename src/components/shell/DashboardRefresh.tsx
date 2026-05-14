"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const POLL_MS = 30_000;

/** Short polling for server-rendered board + radar freshness (optional cross-cutting). */
export function DashboardRefresh() {
  const router = useRouter();

  useEffect(() => {
    const id = window.setInterval(() => {
      router.refresh();
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, [router]);

  return null;
}
