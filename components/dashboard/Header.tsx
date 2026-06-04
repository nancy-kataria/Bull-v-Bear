import Link from "next/link";
import { Scale, LogOut } from "lucide-react";
import { signOut } from "@/app/auth/actions";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-system/15 ring-1 ring-system/40">
            <Scale className="h-4 w-4 text-system" />
          </div>
          <span className="font-mono text-sm font-semibold tracking-wide">
            Bull v. Bear
          </span>
        </Link>
        <button
          onClick={() => signOut()}
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <LogOut className="h-3.5 w-3.5" /> Sign Out
        </button>
      </div>
    </header>
  );
}
