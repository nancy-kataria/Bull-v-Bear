"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { useProtected } from "@/lib/use-protected";
interface NavProps {
  setShowSignInModal: (value: boolean) => void;
  setShowSignUpModal: (value: boolean) => void;
}

export function Nav({ setShowSignInModal, setShowSignUpModal }: NavProps) {
  const { isAuthenticated } = useProtected();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="relative flex h-10 w-10 items-center justify-center">
            <Image 
              src="/Green-Bull.png" 
              alt="Bull v. Bear" 
              width={40} 
              height={40} 
              className="h-full w-full"
            />
            <span
              className="absolute -inset-px rounded-lg"
              style={{ boxShadow: "var(--glow-system)", opacity: 0.4 }}
            />
          </div>
          <span className="font-mono text-sm font-semibold tracking-wide">
            Bull v. Bear
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
