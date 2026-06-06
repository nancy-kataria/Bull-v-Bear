import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t border-border/60 py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
        <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
          <Image 
            src="/Green-Bull.png" 
            alt="Bull v. Bear" 
            width={14} 
            height={14} 
            className="h-3.5 w-3.5"
          />
          <span>Bull v. Bear © 2026 · Not financial advice</span>
        </div>
        <div className="flex items-center gap-5 text-xs text-muted-foreground">
          <a className="hover:text-foreground" href="#">
            Privacy
          </a>
          <a className="hover:text-foreground" href="#">
            Terms
          </a>
          <a className="hover:text-foreground" href="#">
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}
