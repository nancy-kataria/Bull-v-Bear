import type { Folder } from "@/types";

// Most recent updated at
export function lastEdited(folder: Folder): number {
  return folder.notes.reduce((max, n) => Math.max(max, n.updatedAt), 0);
}

// "time ago" label
export function formatRelative(ts: number): string {
  if (!ts) return "—";
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(ts).toLocaleDateString();
}

// Absolute timestamp "Jun 21, 2026, 03:04 AM".
export function formatDate(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
