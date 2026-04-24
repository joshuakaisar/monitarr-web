"use client";

import { useState, useMemo } from "react";
import { useQueue } from "@/hooks/useQueue";
import { ServiceBadge } from "@/components/badges/ServiceBadge";
import { StatusBadge } from "@/components/badges/StatusBadge";
import { TerminalIdleBar } from "@/components/terminal/TerminalIdleBar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import { formatBytes } from "@/lib/utils";
import type { QueueItem, QueueItemStatus } from "@/types/common";

type ServiceFilter = "all" | "sonarr" | "radarr" | "lidarr";
type StatusFilter = "all" | "downloading" | "stalled" | "paused";
type SortKey = "name" | "progress" | "eta" | "size" | "added";

const SERVICE_FILTERS: { label: string; value: ServiceFilter }[] = [
  { label: "All", value: "all" },
  { label: "Sonarr", value: "sonarr" },
  { label: "Radarr", value: "radarr" },
  { label: "Lidarr", value: "lidarr" },
];

const STATUS_FILTERS: { label: string; value: StatusFilter }[] = [
  { label: "All", value: "all" },
  { label: "Downloading", value: "downloading" },
  { label: "Stalled", value: "stalled" },
  { label: "Paused", value: "paused" },
];

const SORT_OPTIONS: { label: string; value: SortKey }[] = [
  { label: "Name", value: "name" },
  { label: "Progress", value: "progress" },
  { label: "ETA", value: "eta" },
  { label: "Size", value: "size" },
  { label: "Added", value: "added" },
];

function etaMs(eta: string | null): number {
  if (!eta) return Infinity;
  return new Date(eta).getTime() - Date.now();
}

function formatEta(eta: string | null): string {
  if (!eta) return "—";
  const diff = new Date(eta).getTime() - Date.now();
  if (diff <= 0) return "done";
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return `${hours}h ${remainMins}m`;
}

function sortItems(items: QueueItem[], key: SortKey): QueueItem[] {
  return [...items].sort((a, b) => {
    switch (key) {
      case "name":
        return a.title.localeCompare(b.title);
      case "progress":
        return b.progress - a.progress;
      case "eta":
        return etaMs(a.eta) - etaMs(b.eta);
      case "size":
        return b.size - a.size;
      case "added":
        return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
      default:
        return 0;
    }
  });
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center font-mono font-bold uppercase tracking-[0.3px] rounded-[3px] text-[10px] px-1.5 py-0.5 transition-colors"
      style={{
        color: active ? "var(--color-accent-terminal)" : "var(--color-text-secondary)",
        backgroundColor: active
          ? "color-mix(in srgb, var(--color-accent-terminal) 12.5%, transparent)"
          : "transparent",
      }}
    >
      {label}
    </button>
  );
}

function SummaryBar({
  activeCount,
  stalledCount,
  totalSize,
  onStalledClick,
}: {
  activeCount: number;
  stalledCount: number;
  totalSize: number;
  onStalledClick: () => void;
}) {
  return (
    <div
      className="flex items-center gap-4 rounded-[14px] px-4 py-3"
      style={{ background: "#2C2C2E" }}
    >
      <div className="flex items-center gap-2">
        <span
          className="inline-block rounded-full"
          style={{ width: 6, height: 6, background: "var(--color-semantic-success)" }}
        />
        <span className="font-mono text-[12px] text-text-default tabular-nums">
          <span className="font-bold">{activeCount}</span>{" "}
          <span className="text-text-muted">Downloading</span>
        </span>
      </div>

      <div className="w-px self-stretch" style={{ background: "#3A3A3C" }} />

      <button
        onClick={onStalledClick}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        <span
          className="inline-block rounded-full"
          style={{ width: 6, height: 6, background: "var(--color-semantic-warning)" }}
        />
        <span className="font-mono text-[12px] text-text-default tabular-nums">
          <span className="font-bold">{stalledCount}</span>{" "}
          <span className="text-text-muted">Stalled</span>
        </span>
      </button>

      <div className="w-px self-stretch" style={{ background: "#3A3A3C" }} />

      <div className="flex items-center gap-2">
        <span
          className="inline-block rounded-full"
          style={{ width: 6, height: 6, background: "var(--color-text-secondary)" }}
        />
        <span className="font-mono text-[12px] text-text-default tabular-nums">
          <span className="font-bold">{formatBytes(totalSize)}</span>{" "}
          <span className="text-text-muted">Total size</span>
        </span>
      </div>
    </div>
  );
}

function QueueCard({
  item,
  index,
}: {
  item: QueueItem;
  index: number;
}) {
  const isStalled = item.status === "stalled";
  const isFailed = item.status === "failed";

  const borderClass = isStalled
    ? "border-l-2 border-l-[var(--color-semantic-warning)]"
    : isFailed
      ? "border-l-2 border-l-[var(--color-semantic-error)]"
      : "";

  const SERVICE_COLORS: Record<string, string> = {
    sonarr: "var(--color-service-sonarr)",
    radarr: "var(--color-service-radarr)",
    lidarr: "var(--color-service-lidarr)",
  };

  return (
    <div
      className={`rounded-[14px] ${borderClass} animate-in fade-in slide-in-from-bottom-2`}
      style={{
        background: "#2C2C2E",
        padding: "13px 14px",
        animationDelay: `${index * 50}ms`,
        animationFillMode: "backwards",
      }}
    >
      {/* Top row */}
      <div className="flex items-center gap-2">
        <span className="text-[15px] font-bold text-text-default truncate flex-1">
          {item.title}
        </span>
        <ServiceBadge service={item.service} size="sm" />
        <StatusBadge status={item.status} size="sm" />
      </div>

      {/* Second row */}
      <div className="flex items-center justify-between mt-1">
        <span className="font-mono text-[11px] truncate" style={{ color: "#484F58" }}>
          {item.subtitle}
        </span>
        <span className="font-mono text-[11px] text-text-muted tabular-nums shrink-0 ml-2">
          {formatEta(item.eta)}
        </span>
      </div>

      {/* Progress row */}
      <div className="flex items-center gap-2 mt-2">
        <div
          className="relative flex-1 rounded-full overflow-hidden"
          style={{ height: 4, background: "#3A3A3C" }}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(item.progress, 100)}%`,
              background: SERVICE_COLORS[item.service] ?? "#BF5AF2",
            }}
          />
        </div>
        <span className="font-mono text-[11px] text-text-muted tabular-nums shrink-0">
          {Math.round(item.progress)}%
        </span>

        {isStalled && (
          <button
            onClick={() => {
              console.log("Retry:", item.id, item.title);
            }}
            className="opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity ml-1"
            style={{ color: "var(--color-semantic-warning)" }}
            title="Retry"
          >
            <ChevronRightIcon className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export default function QueuePage() {
  const { items, isLoading, isError, stalledCount, activeCount } = useQueue();

  const [serviceFilter, setServiceFilter] = useState<ServiceFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("added");

  const filtered = useMemo(() => {
    let result = items;
    if (serviceFilter !== "all") {
      result = result.filter((q) => q.service === serviceFilter);
    }
    if (statusFilter !== "all") {
      result = result.filter((q) => q.status === statusFilter);
    }
    return sortItems(result, sortKey);
  }, [items, serviceFilter, statusFilter, sortKey]);

  const totalSize = useMemo(
    () => items.reduce((sum, q) => sum + q.size, 0),
    [items],
  );

  const filterLabel = statusFilter !== "all" ? statusFilter : "filtered";

  return (
    <div className="space-y-4 max-w-[960px]">
      {/* Top bar */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-text-default">Queue</h1>
          {items.length > 0 && (
            <span
              className="font-mono text-[11px] font-bold tabular-nums rounded-[3px] px-1.5 py-0.5"
              style={{
                background: "#2C2C2E",
                color: "var(--color-text-secondary)",
              }}
            >
              {items.length}
            </span>
          )}
        </div>

        {/* Filter row */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1">
            {SERVICE_FILTERS.map((f) => (
              <FilterChip
                key={f.value}
                label={f.label}
                active={serviceFilter === f.value}
                onClick={() => setServiceFilter(f.value)}
              />
            ))}

            <div className="w-px h-4 mx-1" style={{ background: "#3A3A3C" }} />

            {STATUS_FILTERS.map((f) => (
              <FilterChip
                key={f.value}
                label={f.label}
                active={statusFilter === f.value}
                onClick={() => setStatusFilter(f.value)}
              />
            ))}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              className="inline-flex items-center gap-1 font-mono text-[11px] text-text-muted hover:text-text-default transition-colors rounded px-2 py-1"
              style={{ background: "#2C2C2E" }}
            >
              Sort: {SORT_OPTIONS.find((o) => o.value === sortKey)?.label}
              <ChevronDownIcon className="size-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {SORT_OPTIONS.map((opt) => (
                <DropdownMenuItem
                  key={opt.value}
                  onClick={() => setSortKey(opt.value)}
                >
                  <span
                    className={`font-mono text-[12px] ${
                      sortKey === opt.value ? "text-accent-terminal" : ""
                    }`}
                  >
                    {opt.label}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Summary bar */}
      {!isLoading && items.length > 0 && (
        <SummaryBar
          activeCount={activeCount}
          stalledCount={stalledCount}
          totalSize={totalSize}
          onStalledClick={() => setStatusFilter("stalled")}
        />
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-[14px]" />
          ))}
        </div>
      )}

      {/* Error state */}
      {isError && (
        <TerminalIdleBar message="queue error: failed to fetch downloads" />
      )}

      {/* Empty state — no items at all */}
      {!isLoading && !isError && items.length === 0 && (
        <TerminalIdleBar message="queue status: idle — no active downloads ■" />
      )}

      {/* Empty state — filter yields nothing */}
      {!isLoading && !isError && items.length > 0 && filtered.length === 0 && (
        <TerminalIdleBar message={`No ${filterLabel} downloads`} />
      )}

      {/* Queue cards */}
      {!isLoading && filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map((item, i) => (
            <div key={item.id} className="group">
              <QueueCard item={item} index={i} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
