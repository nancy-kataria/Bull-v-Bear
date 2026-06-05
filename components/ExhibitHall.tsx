"use client";

import { useState } from "react";
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
  const [noteText, setNoteText] = useState("");
  const [ingestLoading, setIngestLoading] = useState(false);
  const [ingestStatus, setIngestStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [ingestMessage, setIngestMessage] = useState("");

  const handleIngestNote = async () => {
    if (!noteText.trim()) return;

    setIngestLoading(true);
    setIngestStatus("loading");
    setIngestMessage("");

    try {
      const response = await fetch("/api/ingest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: noteText,
          metadata: {
            source: "exhibit-hall",
            type: "note",
            createdAt: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          setIngestStatus("error");
          setIngestMessage("Unauthorized. Please sign in.");
          setIngestLoading(false);
          return;
        }
        throw new Error("Failed to ingest note");
      }

      setIngestStatus("success");
      setIngestMessage("Note ingested successfully");
      setNoteText("");

      // Clear success message after 3 seconds
      setTimeout(() => {
        setIngestStatus("idle");
        setIngestMessage("");
      }, 3000);
    } catch (error) {
      setIngestStatus("error");
      setIngestMessage(
        error instanceof Error ? error.message : "Failed to ingest note",
      );
    } finally {
      setIngestLoading(false);
    }
  };

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
          return (
            <div
              key={source.id}
              className="group flex items-start gap-3 p-3 rounded-lg bg-navy-800 border border-neutral-border hover:border-electric/30 hover:bg-navy-700/60 transition-all duration-200 cursor-pointer"
            >
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
                  <ExternalLink
                    size={11}
                    className="text-neutral-muted shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs font-mono ${cfg.color}`}>
                    {source.domain}
                  </span>
                  <span className="text-xs text-neutral-muted">
                    {source.date}
                  </span>
                </div>
              </div>
              <div className="shrink-0">
                <span className="text-xs font-mono text-neutral-muted bg-navy-600 px-1.5 py-0.5 rounded border border-neutral-border">
                  EX-{String(i + 1).padStart(2, "0")}
                </span>
              </div>
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
