// Small latency-stats helpers shared by the benchmark scripts.

export interface Stats {
  count: number;
  mean: number;
  p50: number;
  p95: number;
  p99: number;
  min: number;
  max: number;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(
    sorted.length - 1,
    Math.ceil((p / 100) * sorted.length) - 1,
  );
  return sorted[Math.max(0, idx)];
}

export function stats(samples: number[]): Stats {
  const sorted = [...samples].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  return {
    count: sorted.length,
    mean: sum / sorted.length,
    p50: percentile(sorted, 50),
    p95: percentile(sorted, 95),
    p99: percentile(sorted, 99),
    min: sorted[0] ?? 0,
    max: sorted[sorted.length - 1] ?? 0,
  };
}

const ms = (n: number) => `${n.toFixed(1)} ms`;

export function reportRow(label: string, s: Stats): void {
  console.log(
    `${label.padEnd(22)} mean ${ms(s.mean).padStart(10)} | ` +
      `p50 ${ms(s.p50).padStart(10)} | ` +
      `p95 ${ms(s.p95).padStart(10)} | ` +
      `p99 ${ms(s.p99).padStart(10)}`,
  );
}
