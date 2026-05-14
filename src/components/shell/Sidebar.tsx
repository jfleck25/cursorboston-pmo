"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShellClient } from "./ShellClient";

export function Sidebar({ avatarUrl }: { avatarUrl: string | null }) {
  const pathname = usePathname();

  const navLinks = [
    {
      name: "Command Center",
      href: "/",
      active: pathname === "/",
    },
    {
      name: "Assembly Line",
      href: "/assembly",
      active: pathname === "/assembly",
    },
    {
      name: "Friday Launch",
      href: "/friday",
      active: pathname === "/friday",
    },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-surface-border bg-surface-dim">
      <div className="flex h-24 items-center gap-3 border-b border-surface-border px-6">
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface border border-surface-border overflow-hidden">
          <div className="absolute -inset-2 rounded-full bg-ship/20 blur-md" />
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt="Profile"
              width={40}
              height={40}
              className="relative z-10 rounded-full object-cover"
            />
          ) : (
            <span className="material-symbols-outlined text-ship relative z-10" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
          )}
        </div>
        <div className="flex flex-col">
          <h1 className="font-sans text-lg font-bold text-ship tracking-wide">Momentum</h1>
          <span className="font-mono text-[9px] text-ink-muted uppercase tracking-widest">
            Shipping<br/>Engine
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-2 p-4">
        {navLinks.map((link) => (
          <Link
            key={link.name}
            href={link.href}
            className={`block rounded-r-md px-3 py-2 font-mono text-xs font-bold transition-colors ${
              link.active
                ? "border-l-2 border-ship bg-ship/10 text-ship"
                : "text-ink-muted hover:bg-surface-raised/50 hover:text-ink"
            }`}
          >
            {link.name}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-surface-border">
        <ShellClient variant="sidebar" />
      </div>
    </aside>
  );
}
