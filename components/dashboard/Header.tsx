import Link from "next/link";
import Image from "next/image";
import { LogOut } from "lucide-react";
import { signOut } from "@/app/auth/actions";

export function Header() {
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
        <div className="flex items-center gap-3">
          <Link
            href="/analysis-room"
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium border border-system text-system transition hover:bg-system/10"
          >
            Bull v. Bear Analysis
          </Link>
          <button
            onClick={() => signOut()}
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}
