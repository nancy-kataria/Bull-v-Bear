import { Info } from "lucide-react";

export function DisclaimerBanner() {
  return (
    <div className="border-b border-judge/30 bg-judge/5 px-6 py-2.5">
      <div className="mx-auto flex max-w-3xl items-start gap-2.5 text-xs text-judge">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <p className="leading-relaxed">
          This is not investment advice. The trading assistant is here to help you learn the
          principles of disciplined trading — every decision and its consequences remain
          entirely your own.
        </p>
      </div>
    </div>
  );
}
