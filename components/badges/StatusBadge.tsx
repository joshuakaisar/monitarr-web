/** Badge displaying a status with semantic coloring. */

const STATUS_COLOR_MAP = {
  online: "var(--color-semantic-success)",
  completed: "var(--color-semantic-success)",
  seeding: "var(--color-semantic-success)",
  offline: "var(--color-semantic-error)",
  failed: "var(--color-semantic-error)",
  missing: "var(--color-semantic-error)",
  stalled: "var(--color-semantic-warning)",
  pending: "var(--color-semantic-warning)",
  downloading: "var(--color-semantic-info)",
  paused: "var(--color-text-secondary)",
  monitored: "var(--color-semantic-success)",
  unmonitored: "var(--color-text-secondary)",
} as const;

type Status = keyof typeof STATUS_COLOR_MAP;

interface StatusBadgeProps {
  status: Status;
  size?: "sm" | "md";
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const color = STATUS_COLOR_MAP[status];

  return (
    <span
      className={`inline-flex items-center font-mono font-bold uppercase tracking-[0.3px] rounded-[3px] ${
        size === "sm" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-1"
      }`}
      style={{
        color,
        backgroundColor: `color-mix(in srgb, ${color} 12.5%, transparent)`,
      }}
    >
      {status}
    </span>
  );
}
