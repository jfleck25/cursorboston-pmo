"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "momentum-reduced-motion";

type MotionPreferenceContextValue = {
  /** True when decorative / non-essential motion should be disabled. */
  decorativeMotionDisabled: boolean;
  /** User opt-in to reduced motion (stored in localStorage). */
  userReducedMotion: boolean;
  setUserReducedMotion: (value: boolean) => void;
};

const MotionPreferenceContext = createContext<MotionPreferenceContextValue | null>(
  null,
);

function readStored(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(STORAGE_KEY) === "1";
}

export function MotionPreferenceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [systemReduced, setSystemReduced] = useState(false);
  const [userReducedMotion, setUserReducedMotionState] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setUserReducedMotionState(readStored());
    setHydrated(true);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setSystemReduced(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const setUserReducedMotion = useCallback((value: boolean) => {
    setUserReducedMotionState(value);
    if (typeof window !== "undefined") {
      if (value) window.localStorage.setItem(STORAGE_KEY, "1");
      else window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const decorativeMotionDisabled = systemReduced || userReducedMotion;

  const value = useMemo(
    () => ({
      decorativeMotionDisabled,
      userReducedMotion,
      setUserReducedMotion,
    }),
    [decorativeMotionDisabled, userReducedMotion, setUserReducedMotion],
  );

  if (!hydrated) {
    return (
      <MotionPreferenceContext.Provider
        value={{
          decorativeMotionDisabled: systemReduced,
          userReducedMotion: false,
          setUserReducedMotion,
        }}
      >
        {children}
      </MotionPreferenceContext.Provider>
    );
  }

  return (
    <MotionPreferenceContext.Provider value={value}>
      {children}
    </MotionPreferenceContext.Provider>
  );
}

export function useMotionPreference() {
  const ctx = useContext(MotionPreferenceContext);
  if (!ctx) {
    throw new Error("useMotionPreference must be used within MotionPreferenceProvider");
  }
  return ctx;
}
