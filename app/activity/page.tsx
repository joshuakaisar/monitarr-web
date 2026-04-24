"use client";

import { useState, useMemo } from "react";
import {
  ArrowDownTrayIcon,
  CheckCircleIcon,
  XCircleIcon,
  TrashIcon,
  PencilIcon,
} from "@heroicons/react/20/solid";
import { useActivityEvents } from "@/hooks/useActivity";
import { ServiceBadge } from "@/components/badges/ServiceBadge";
import { TerminalIdleBar } from "@/components/terminal/TerminalIdleBar";
import { Skeleton } from "@/components/ui/skeleton";
import { formatBytes } from "@/lib/utils";
import type { ActivityEvent, ActivityEventType } from "@/types/common";

type ServiceFilter = "all" | "sonarr" | "radarr" | "lidarr";
type EventFilter = "all" | "grabbed" | "imported" | "failed";

const SERVICE_FILTERS: { label: string; value: ServiceFilter }[] = [
  { label: "All", value: "all" },
  { label: "Sonarr", value: "sonarr" },
  { label: "Radarr", value: "radarr" },
  { label: "Lidarr", value: "lidarr" },
];

const EVENT_FILTERS: { label: string; value: EventFilter }[] = [
  { label: "All", value: "all" },
  { label: "Grabbed", value: "grabbed" },
  { label: "Imported", value: "imported" },
  { label: "Failed", value: "failed" },
];

const EVENT_ICON_CONFIG: Record<
  ActivityEventType,
  { Icon: typeof ArrowDownTrayIcon; bg: string; color: string }
> = {
  grabbed: {
    Icon: ArrowDownTrayIcon,
    bg: "color-mix(in srgb, #30D158 18%, transparent)",
    color: "#30D158",
  },
  imported: {
    Icon: CheckCircleIcon,
    bg: "color-mix(in srgb, #0A84FF 18%, transparent)",
    color: "#0A84FF",
  },
  failed: {
    Icon: XCircleIcon,
    bg: "color-mix(in srgb, #FF453A 18%, transparent)",
    color: "#FF453A",
  },
  deleted: {
    Icon: TrashIcon,
    bg: "color-mix(in srgb, #6E6E73 18%, transparent)",
    color: "#6E6E73",
  },
  renamed: {
    Icon: PencilIcon,
    bg: "color-mix(in srgb, #6E6E73 18%, transparent)",
    color: "#6E6E73",
  },
};

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
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
        color: active
          ? "var(--color-accent-terminal)"
          : "var(--color-text-secondary)",
        backgroundColor: active
          ? "color-mix(in srgb, var(--color-accent-terminal) 12.5%, transparent)"
          : "transparent",
      }}
    >
      {label}
    </button>
  );
}

function EventRow({ event }: { event: ActivityEvent }) {
  const [expanded, setExpanded] = useState(false);
  const config = EVENT_ICON_CONFIG[event.eventType];
  const { Icon } = config;

  return (
    <div>
      <div
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-3 py-1.5 cursor-pointer group transition-all hover:pl-1"
      >
        {/* Icon */}
        <div
          className="flex items-center justify-center shrink-0 rounded-[6px]"
          style={{
            width: 26,
            height: 26,
            background: config.bg,
            color: config.color,
          }}
        >
          <Icon className="size-3.5" />
        </div>

        {/* Center */}
        <div className="flex-1 min-w-0">
          <p className="text-[13px] text-text-default truncate">{event.title}</p>
          <p className="text-[11px] truncate" style={{ color: "#6E6E73" }}>
            {event.subtitle}
          </p>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 shrink-0">
          <ServiceBadge service={event.service} size="sm" />
          <span
            className="font-mono tabular-nums"
            style={{ fontSize: 10, color: "#484F58" }}
          >
            {formatRelativeTime(event.date)}
          </span>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div
          className="ml-[38px] mb-2 rounded-sm font-mono text-[11px] text-text-muted"
          style={{ background: "#1b1d23", padding: 8 }}
        >
          {event.indexer && (
            <div>
              <span style={{ color: "#484F58" }}>indexer: </span>
              {event.indexer}
            </div>
          )}
          {event.releaseTitle && (
            <div className="truncate">
              <span style={{ color: "#484F58" }}>release: </span>
              {event.releaseTitle}
            </div>
          )}
          {event.size != null && event.size > 0 && (
            <div>
              <span style={{ color: "#484F58" }}>size: </span>
              {formatBytes(event.size)}
            </div>
          )}
          {!event.indexer && !event.releaseTitle && (!event.size || event.size === 0) && (
            <div style={{ color: "#484F58" }}>No additional details</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ActivityPage() {
  const { groups, isLoading, isError, totalCount } = useActivityEvents();
  const [serviceFilter, setServiceFilter] = useState<ServiceFilter>("all");
  const [eventFilter, setEventFilter] = useState<EventFilter>("all");

  const filteredGroups = useMemo(() => {
    return groups
      .map((group) => ({
        ...group,
        events: group.events.filter((e) => {
          if (serviceFilter !== "all" && e.service !== serviceFilter) return false;
          if (eventFilter !== "all" && e.eventType !== eventFilter) return false;
          return true;
        }),
      }))
      .filter((group) => group.events.length > 0);
  }, [groups, serviceFilter, eventFilter]);

  const filteredCount = filteredGroups.reduce(
    (sum, g) => sum + g.events.length,
    0,
  );

  return (
    <div className="space-y-4 max-w-[960px]">
      {/* Top bar */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-text-default">Activity</h1>
          {!isLoading && totalCount > 0 && (
            <span
              className="font-mono text-[11px] text-text-muted tabular-nums"
            >
              {filteredCount} events
            </span>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1 flex-wrap">
          {SERVICE_FILTERS.map((f) => (
            <FilterChip
              key={f.value}
              label={f.label}
              active={serviceFilter === f.value}
              onClick={() => setServiceFilter(f.value)}
            />
          ))}

          <div className="w-px h-4 mx-1" style={{ background: "#3A3A3C" }} />

          {EVENT_FILTERS.map((f) => (
            <FilterChip
              key={f.value}
              label={f.label}
              active={eventFilter === f.value}
              onClick={() => setEventFilter(f.value)}
            />
          ))}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <TerminalIdleBar message="history: failed to fetch activity" />
      )}

      {/* Empty — no data */}
      {!isLoading && !isError && totalCount === 0 && (
        <TerminalIdleBar message="history: no recent activity ■" />
      )}

      {/* Empty — filter yields nothing */}
      {!isLoading && !isError && totalCount > 0 && filteredGroups.length === 0 && (
        <TerminalIdleBar message="history: no matching events" />
      )}

      {/* Groups */}
      {!isLoading && filteredGroups.length > 0 && (
        <div className="space-y-4">
          {filteredGroups.map((group) => (
            <div key={group.date}>
              {/* Day header */}
              <div
                className="font-mono uppercase text-[11px] font-semibold tracking-[0.8px] pb-1.5 mb-1"
                style={{
                  color: "#484F58",
                  borderBottom: "0.5px solid #2E3035",
                }}
              >
                {group.date}
              </div>

              {/* Events */}
              <div>
                {group.events.map((event) => (
                  <EventRow key={event.id} event={event} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
