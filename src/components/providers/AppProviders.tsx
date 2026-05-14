"use client";

import { SessionProvider } from "next-auth/react";
import { MotionPreferenceProvider } from "./MotionPreferenceProvider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <MotionPreferenceProvider>{children}</MotionPreferenceProvider>
    </SessionProvider>
  );
}
