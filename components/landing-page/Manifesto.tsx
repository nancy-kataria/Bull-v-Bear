import { ArrowRight, Sparkles } from "lucide-react";

interface ManifestoProps {
  setShowSignUpModal: (value: boolean) => void;
}

export function Manifesto({ setShowSignUpModal }: ManifestoProps) {
  return (
    <section
      id="manifesto"
      className="relative border-t border-border/60 py-24"
    >
      <div className="absolute inset-0 grid-paper opacity-30" aria-hidden />
      <div className="relative mx-auto max-w-4xl px-6 text-center">
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-judge">
          Order in the court
        </span>
        <h2 className="mt-4 text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          The market is loud.
          <br />
          <span className="text-muted-foreground">A jury is structured.</span>
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          One model whispering an answer is a guess. Two adversaries arguing,
          judged by a third, is a process. Bull v. Bear turns AI output into
          evidence — auditable, citable, defensible.
        </p>

        <div className="mt-8 flex justify-center">
          <button 
            onClick={() => setShowSignUpModal(true)}
            className="group inline-flex items-center gap-2 rounded-lg bg-system px-5 py-3 text-sm font-semibold text-system-foreground shadow-[var(--glow-system)] transition hover:brightness-110"
          >
            Sign up to access
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </section>
  );
}
