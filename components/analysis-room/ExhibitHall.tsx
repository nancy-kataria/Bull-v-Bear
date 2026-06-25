import {
  FileText,
  Globe,
  StickyNote,
  ExternalLink,
} from "lucide-react";
import type { Source } from "@/types";

interface Props {
  sources: Source[];
}

const sourceConfig = {
  filing: {
    icon: FileText,
    color: "text-amber-verdict",
    bg: "bg-amber-dim/30",
    label: "SEC Filing",
  },
  web: {
    icon: Globe,
    color: "text-electric",
    bg: "bg-electric-dim/30",
    label: "Web Source",
  },
  note: {
    icon: StickyNote,
    color: "text-amber-verdict",
    bg: "bg-amber-dim/30",
    label: "Private Note",
  },
};

export default function ExhibitHall({ sources }: Props) {

  return (
    <div className="card-base h-full flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-border">
        <div>
          <div className="text-xs font-mono font-semibold text-neutral-label tracking-widest uppercase">
            Exhibit Hall
          </div>
          <div className="text-xs text-neutral-muted font-mono mt-0.5">
            {sources.length} references entered
          </div>
        </div>
        <div className="flex -space-x-2">
          {sources.slice(0, 3).map((_, i) => (
            <div
              key={i}
              className="w-7 h-8 bg-navy-700 border border-neutral-border rounded-sm shadow-sm"
              style={{ transform: `rotate(${(i - 1) * 5}deg)`, zIndex: i }}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {sources.map((source, i) => {
          const cfg = sourceConfig[source.type];
          const Icon = cfg.icon;
          const isLink = source.type === "web" && !!source.url;
          const cardClass = `group flex items-start gap-3 p-3 rounded-lg bg-navy-800 border border-neutral-border transition-all duration-200 ${
            isLink
              ? "hover:border-electric/30 hover:bg-navy-700/60 cursor-pointer"
              : "hover:border-neutral-muted/40"
          }`;

          const inner = (
            <>
              <div
                className={`flex items-center justify-center w-7 h-7 rounded ${cfg.bg} ${cfg.color} shrink-0 mt-0.5`}
              >
                <Icon size={13} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-medium text-neutral-white leading-snug group-hover:text-neutral-white/90 line-clamp-2">
                    {source.title}
                  </span>
                  {isLink && (
                    <ExternalLink
                      size={11}
                      className="text-neutral-muted shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  )}
                </div>
                {source.snippet && (
                  <p className="text-xs text-neutral-muted leading-snug mt-1 line-clamp-3">
                    {source.snippet}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`text-xs font-mono ${cfg.color}`}>
                    {source.domain}
                  </span>
                  {source.date && (
                    <span className="text-xs text-neutral-muted">
                      {source.date}
                    </span>
                  )}
                </div>
              </div>
              <div className="shrink-0">
                <span className="text-xs font-mono text-neutral-muted bg-navy-600 px-1.5 py-0.5 rounded border border-neutral-border">
                  EX-{String(i + 1).padStart(2, "0")}
                </span>
              </div>
            </>
          );

          return isLink ? (
            <a
              key={source.id}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cardClass}
            >
              {inner}
            </a>
          ) : (
            <div key={source.id} className={cardClass}>
              {inner}
            </div>
          );
        })}
      </div>

      <div className="px-4 py-3 border-t border-neutral-border">
        <div className="flex items-center justify-between text-xs font-mono text-neutral-muted">
          <span>Sources indexed</span>
          <div className="flex gap-3">
            <span className="text-electric">
              {sources.filter((s) => s.type === "web").length} web
            </span>
            <span className="text-amber-verdict">
              {sources.filter((s) => s.type !== "web").length} internal
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
