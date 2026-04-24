/** Stat card with animated count-up, optional trend badge, and loading skeleton. */
"use client";

import { useEffect, useRef, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface Trend {
  value: number;
  direction: "up" | "down" | "neutral";
}

interface StatTileProps {
  label: string;
  value: number;
  trend?: Trend;
  accentColor: string;
  isLoading?: boolean;
}

const TREND_COLORS = {
  up: "var(--color-semantic-success)",
  down: "var(--color-semantic-error)",
  neutral: "var(--color-text-secondary)",
} as const;

function useCountUp(target: number, duration = 900) {
  const [current, setCurrent] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();
    const from = 0;

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out quad
      const eased = 1 - (1 - progress) * (1 - progress);
      setCurrent(Math.round(from + (target - from) * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return current;
}

export function StatTile({
  label,
  value,
  trend,
  accentColor,
  isLoading = false,
}: StatTileProps) {
  const displayed = useCountUp(isLoading ? 0 : value);

  if (isLoading) {
    return (
      <div className="bg-bg-secondary rounded-[14px] p-4">
        <Skeleton className="h-3 w-20 mb-3" />
        <Skeleton className="h-8 w-16" />
      </div>
    );
  }

  return (
    <div className="bg-bg-secondary rounded-[14px] p-4">
      <p className="font-mono uppercase text-[11px] font-semibold tracking-[0.8px] text-text-muted mb-2">
        {label}
      </p>
      <div className="flex items-baseline gap-2">
        <span
          className="text-2xl font-bold tabular-nums"
          style={{ color: accentColor }}
        >
          {displayed}
        </span>
        {trend && <TrendBadge trend={trend} />}
      </div>
    </div>
  );
}

function TrendBadge({ trend }: { trend: Trend }) {
  const color = TREND_COLORS[trend.direction];
  const arrow = trend.direction === "up" ? "\u2191" : trend.direction === "down" ? "\u2193" : "\u2192";

  return (
    <span
      className="inline-flex items-center font-mono font-bold uppercase tracking-[0.3px] rounded-[3px] text-[10px] px-1.5 py-0.5"
      style={{
        color,
        backgroundColor: `color-mix(in srgb, ${color} 12.5%, transparent)`,
      }}
    >
      {arrow} {trend.value}%
    </span>
  );
}
