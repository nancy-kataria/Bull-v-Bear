import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

interface HeaderProps {
  backLink?: { href: string; label: string };
  badge?: string;
  actions?: React.ReactNode;
  maxWidth?: string;
}

export function Header({ backLink, badge, actions, maxWidth = "max-w-7xl" }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className={`mx-auto flex ${maxWidth} items-center justify-between px-6 py-4`}>
        <div className="flex items-center gap-4">
          {backLink && (
            <>
              <Link
                href={backLink.href}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> {backLink.label}
              </Link>
              <div className="h-5 w-px bg-border" />
            </>
          )}
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
            {badge && (
              <span className="ml-2 hidden rounded-md border border-border bg-surface px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground sm:inline">
                {badge}
              </span>
            )}
          </Link>
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
    </header>
  );
}
