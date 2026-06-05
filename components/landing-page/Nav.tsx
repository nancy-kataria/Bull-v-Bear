"use client";

import Link from "next/link";
import { ArrowRight, Scale } from "lucide-react";
import { useProtected } from "@/lib/use-protected";
import type { NavProps } from '@/types';

export function Nav({ setShowSignInModal, setShowSignUpModal }: NavProps) {
  const { isAuthenticated } = useProtected();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-system/15 ring-1 ring-system/40">
            <Scale className="h-4 w-4 text-system" />
            <span
              className="absolute -inset-px rounded-lg"
              style={{ boxShadow: "var(--glow-system)", opacity: 0.4 }}
            />
          </div>
          <span className="font-mono text-sm font-semibold tracking-wide">
            Bull v. Bear
          </span>
          <span className="ml-1 hidden rounded-md border border-border bg-surface px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground sm:inline">
            v0.1 · Beta
          </span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          <a className="transition hover:text-foreground" href="#how">
            How it works
          </a>
          <a className="transition hover:text-foreground" href="#manifesto">
            Manifesto
          </a>
        </nav>
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <Link 
              href="/dashboard"
              className="group inline-flex items-center gap-1.5 rounded-md bg-system px-3.5 py-2 text-sm font-medium text-system-foreground shadow-[var(--glow-system)] transition hover:brightness-110"
            >
              Dashboard
              <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
            </Link>
          ) : (
            <>
              <button 
                onClick={() => setShowSignUpModal(true)}
                className="hidden rounded-md px-3.5 py-2 text-sm font-medium border border-system text-system transition hover:bg-system/10 sm:inline"
              >
                Sign up
              </button>
              <button 
                onClick={() => setShowSignInModal(true)}
                className="group inline-flex items-center gap-1.5 rounded-md bg-system px-3.5 py-2 text-sm font-medium text-system-foreground shadow-[var(--glow-system)] transition hover:brightness-110"
              >
                Sign in
                <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
