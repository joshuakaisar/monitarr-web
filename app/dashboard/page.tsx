"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { StatTile } from "@/components/cards/StatTile";
import { TerminalBlock } from "@/components/terminal/TerminalBlock";
import { TerminalIdleBar } from "@/components/terminal/TerminalIdleBar";
import { ServiceBadge } from "@/components/badges/ServiceBadge";
import { StatusBadge } from "@/components/badges/StatusBadge";
import { SectionLabel } from "@/components/layout/SectionLabel";
import { Skeleton } from "@/components/ui/skeleton";
import { useSystemStatus } from "@/hooks/useSystemStatus";
import { useSonarr } from "@/hooks/useSonarr";
import { useRadarr } from "@/hooks/useRadarr";
import { useQueue } from "@/hooks/useQueue";
import { useActivity } from "@/hooks/useActivity";
import type { QueueItem, ActivityItem } from "@/types/common";

const SERVICE_COLORS: Record<string, string> = {
  sonarr: "var(--color-service-sonarr)",
  radarr: "var(--color-service-radarr)",
  lidarr: "var(--color-service-lidarr)",
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const tb = bytes / (1024 ** 4);
  if (tb >= 1) return `${tb.toFixed(1)} TB`;
  const gb = bytes / (1024 ** 3);
  return `${gb.toFixed(1)} GB`;
}

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

function etaMinutes(eta: string | null): number {
  if (!eta) return Infinity;
  return (new Date(eta).getTime() - Date.now()) / 60_000;
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + "..." : str;
}

// --- Stat Tiles ---
function StatTilesRow() {
  const status = useSystemStatus();
  const sonarr = useSonarr();
  const radarr = useRadarr();
  const queue = useQueue();

  const stalledCount =
    queue.data?.filter((q) => q.status === "warning" || q.status === "stalled")
      .length ?? 0;

  const lidarrConnected = status.data?.lidarr?.connected ?? false;

  return (
    <div className="grid grid-cols-4 gap-[8px]">
      <StatTile
        label="Series"
        value={sonarr.data?.seriesCount ?? 0}
        accentColor="#0A84FF"
        isLoading={sonarr.isLoading}
      />
      <StatTile
        label="Movies"
        value={radarr.data?.movieCount ?? 0}
        accentColor="#FF9F0A"
        isLoading={radarr.isLoading}
      />
      {lidarrConnected ? (
        <StatTile
          label="Artists"
          value={0}
          accentColor="#30D158"
          isLoading={status.isLoading}
        />
      ) : (
        <div className="bg-bg-secondary rounded-[14px] p-4 opacity-45">
          <p className="font-mono uppercase text-[11px] font-semibold tracking-[0.8px] text-text-muted mb-2">
            Artists
          </p>
          <p className="text-sm font-mono text-text-muted">lidarr offline</p>
        </div>
      )}
      <StatTile
        label="Downloading"
        value={queue.data?.length ?? 0}
        accentColor="#BF5AF2"
        isLoading={queue.isLoading}
        trend={
          stalledCount > 0
            ? { value: stalledCount, direction: "down" as const }
            : undefined
        }
      />
    </div>
  );
}

// --- Terminal typed lines ---
function useTypedLines(
  lines: { segments: { text: string; type: string }[] }[],
  delays: number[],
) {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (visibleCount >= lines.length) return;
    const delay = delays[visibleCount] ?? 300;
    const timer = setTimeout(() => setVisibleCount((c) => c + 1), delay);
    return () => clearTimeout(timer);
  }, [visibleCount, lines.length, delays]);

  return lines.slice(0, visibleCount);
}

function UnifiedSystemTerminal() {
  const status = useSystemStatus();
  const queue = useQueue();
  const sonarr = useSonarr();
  const radarr = useRadarr();

  if (status.isLoading) {
    return (
      <div className="rounded-lg p-4" style={{ background: "#1b1d23", border: "0.5px solid #2E3035" }}>
        <Skeleton className="h-4 w-48 mb-3" />
        <Skeleton className="h-3 w-40 mb-2" />
        <Skeleton className="h-3 w-36 mb-2" />
        <Skeleton className="h-3 w-32" />
      </div>
    );
  }

  const services = status.data;
  const connectedCount = services
    ? Object.values(services).filter((s) => s.connected).length
    : 0;
  const totalServices = 4;
  const allConnected = connectedCount === totalServices;

  const activeDownloads = queue.data?.filter(
    (q) => q.status === "downloading" || q.progress < 100,
  ) ?? [];
  const pendingCount = queue.data?.filter(
    (q) => q.status === "queued" || q.status === "pending" || q.progress === 0,
  ).length ?? 0;

  const totalDisk = (sonarr.data?.diskSpace ?? 0) + (radarr.data?.diskSpace ?? 0);
  const totalDiskTb = totalDisk / (1024 ** 4);
  const diskUsedPct = totalDiskTb > 0 ? Math.min(100, Math.round((totalDiskTb / (totalDiskTb * 1.25)) * 100)) : 0;

  type SegType = "prompt" | "value" | "warning" | "error" | "muted" | "default";

  const allLines: { segments: { text: string; type: SegType }[] }[] = [
    {
      segments: [
        { text: "$ ", type: "prompt" },
        { text: "services: ", type: "default" },
        {
          text: `[${connectedCount}/${totalServices} connected]`,
          type: allConnected ? ("prompt" as SegType) : ("error" as SegType),
        },
      ],
    },
    {
      segments: [
        { text: "$ ", type: "prompt" },
        { text: "downloads: ", type: "default" },
        { text: `[${activeDownloads.length} active]`, type: "value" },
        { text: " · queue: ", type: "muted" },
        { text: `[${pendingCount} pending]`, type: "value" },
      ],
    },
    {
      segments: [
        { text: "$ ", type: "prompt" },
        { text: "uptime: ", type: "default" },
        { text: services?.sonarr?.version ? "operational" : "—", type: "value" },
      ],
    },
    {
      segments: [
        { text: "$ ", type: "prompt" },
        { text: "disk: ", type: "default" },
        {
          text: `[${formatBytes(totalDisk)}]`,
          type: diskUsedPct > 80 ? "warning" : ("value" as SegType),
        },
      ],
    },
  ];

  const visibleLines = useTypedLines(allLines, [300, 750, 1150, 1650]);

  return (
    <div>
      <TerminalBlock
        title="monitarr — system status"
        lines={visibleLines as Parameters<typeof TerminalBlock>[0]["lines"]}
        showCursor={visibleLines.length === allLines.length}
      />
      {activeDownloads.length > 0 && visibleLines.length === allLines.length && (
        <div
          className="mt-1 rounded-b-lg px-3 pb-2 pt-1 font-mono text-[11px]"
          style={{ background: "#1b1d23", borderTop: "none" }}
        >
          {activeDownloads.slice(0, 3).map((dl) => (
            <div key={dl.id} className="flex items-center gap-2 py-0.5">
              <span className="text-text-muted truncate" style={{ maxWidth: 120 }}>
                {truncate(dl.title, 18)}
              </span>
              <div
                className="relative rounded-full overflow-hidden"
                style={{ width: 60, height: 3, background: "#2E3035" }}
              >
                <div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    width: `${Math.min(dl.progress, 100)}%`,
                    background: SERVICE_COLORS[dl.service] ?? "#BF5AF2",
                  }}
                />
              </div>
              <span className="text-text-muted tabular-nums">
                {Math.round(dl.progress)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Instances Panel ---
function InstancesPanel() {
  const status = useSystemStatus();
  const router = useRouter();

  const instances: {
    service: "sonarr" | "radarr" | "lidarr" | "prowlarr";
    url: string;
  }[] = [
    { service: "sonarr", url: "localhost:8989" },
    { service: "radarr", url: "localhost:7878" },
    { service: "lidarr", url: "localhost:8686" },
    { service: "prowlarr", url: "localhost:9696" },
  ];

  return (
    <div className="rounded-[14px] h-full" style={{ background: "#2C2C2E" }}>
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <span className="font-mono uppercase text-[11px] font-semibold tracking-[0.8px] text-text-muted">
          Instances
        </span>
        <button
          onClick={() => router.push("/settings")}
          className="font-mono text-[11px] hover:underline"
          style={{ color: "#0A84FF" }}
        >
          + add
        </button>
      </div>
      <div className="px-2 pb-2">
        {instances.map((inst) => {
          const s = status.data?.[inst.service];
          const connected = s?.connected ?? false;
          const statusLabel = connected ? "online" : "offline";

          return (
            <div
              key={inst.service}
              className="flex items-center gap-3 px-2 py-2 rounded-lg cursor-pointer transition-colors hover:bg-[#38383A]"
              style={{ opacity: connected ? 1 : 0.45 }}
            >
              <span
                className="inline-block rounded-full shrink-0"
                style={{
                  width: 5,
                  height: 5,
                  background: connected
                    ? "var(--color-semantic-success)"
                    : "var(--color-semantic-error)",
                  boxShadow: connected
                    ? "0 0 4px var(--color-semantic-success)"
                    : "none",
                  animation: connected
                    ? "pulse 2s ease-in-out infinite"
                    : "none",
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-default truncate capitalize">
                  {inst.service}
                </p>
                <p className="text-[10px] font-mono text-text-muted truncate">
                  {inst.url}
                </p>
              </div>
              <ServiceBadge service={inst.service} size="sm" />
              <StatusBadge status={statusLabel} size="sm" />
            </div>
          );
        })}
      </div>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
    </div>
  );
}

// --- Downloads Table ---
function DownloadsSection() {
  const queue = useQueue();
  const router = useRouter();

  if (queue.isLoading) {
    return (
      <div>
        <SectionLabel>DOWNLOADS</SectionLabel>
        <Skeleton className="h-20 w-full rounded-lg" />
      </div>
    );
  }

  const items = queue.data ?? [];

  if (items.length === 0) {
    return (
      <div>
        <SectionLabel>DOWNLOADS</SectionLabel>
        <TerminalIdleBar message="queue status: idle — no active downloads" />
      </div>
    );
  }

  const displayed = items.slice(0, 5);

  return (
    <div>
      <SectionLabel
        action={{
          label: "view all →",
          onClick: () => router.push("/queue"),
        }}
      >
        DOWNLOADS
      </SectionLabel>
      <div className="overflow-hidden rounded-lg" style={{ border: "0.5px solid #2E3035" }}>
        <table className="w-full text-sm">
          <thead>
            <tr
              className="text-left font-mono uppercase text-[10px] tracking-[0.5px] text-text-muted"
              style={{ borderBottom: "0.5px solid #2E3035" }}
            >
              <th className="px-3 py-2 font-semibold">Title</th>
              <th className="px-3 py-2 font-semibold">Source</th>
              <th className="px-3 py-2 font-semibold">Progress</th>
              <th className="px-3 py-2 font-semibold">Status</th>
              <th className="px-3 py-2 font-semibold text-right">ETA</th>
            </tr>
          </thead>
          <tbody>
            {displayed.map((item) => (
              <DownloadRow key={item.id} item={item} />
            ))}
          </tbody>
        </table>
      </div>
      {items.length > 5 && (
        <p className="mt-2 text-center">
          <button
            onClick={() => router.push("/queue")}
            className="font-mono text-[11px] text-accent-terminal hover:underline"
          >
            +{items.length - 5} more in queue →
          </button>
        </p>
      )}
    </div>
  );
}

function DownloadRow({ item }: { item: QueueItem }) {
  const isStalled = item.status === "stalled" || item.status === "warning";
  const mins = etaMinutes(item.eta);

  return (
    <tr className="transition-colors hover:bg-[#2C2C2E]/30" style={{ borderBottom: "0.5px solid #2E3035" }}>
      <td className="px-3 py-2">
        <p className="font-semibold text-text-default truncate max-w-[200px]">
          {item.title}
        </p>
        <p className="font-mono text-[10px] text-text-muted">
          {item.quality} · {formatBytes(item.size)}
        </p>
      </td>
      <td className="px-3 py-2">
        <ServiceBadge service={item.service} size="sm" />
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          <div
            className="relative rounded-full overflow-hidden"
            style={{ width: 70, height: 4, background: "#2E3035" }}
          >
            <div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                width: `${Math.min(item.progress, 100)}%`,
                background: SERVICE_COLORS[item.service] ?? "#BF5AF2",
              }}
            />
          </div>
          <span className="font-mono text-[10px] text-text-muted tabular-nums">
            {Math.round(item.progress)}%
          </span>
        </div>
      </td>
      <td className="px-3 py-2">
        <StatusBadge
          status={
            isStalled
              ? "stalled"
              : item.progress >= 100
                ? "completed"
                : "downloading"
          }
          size="sm"
        />
      </td>
      <td className="px-3 py-2 text-right">
        <span
          className="font-mono text-[11px] tabular-nums"
          style={{
            color: isStalled
              ? "var(--color-semantic-error)"
              : mins > 60
                ? "var(--color-semantic-warning)"
                : "var(--color-text-secondary)",
          }}
        >
          {isStalled ? "stalled" : formatEta(item.eta)}
        </span>
      </td>
    </tr>
  );
}

// --- Activity Section ---
function ActivitySection() {
  const activity = useActivity();
  const router = useRouter();

  if (activity.isLoading) {
    return (
      <div>
        <SectionLabel>RECENT ACTIVITY</SectionLabel>
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const items = (activity.data ?? []).slice(0, 6);

  if (items.length === 0) {
    return (
      <div>
        <SectionLabel>RECENT ACTIVITY</SectionLabel>
        <p className="text-sm text-text-muted font-mono">No recent activity</p>
      </div>
    );
  }

  return (
    <div>
      <SectionLabel
        action={{
          label: "view all →",
          onClick: () => router.push("/activity"),
        }}
      >
        RECENT ACTIVITY
      </SectionLabel>
      <div className="space-y-1">
        {items.map((item) => (
          <ActivityRow key={`${item.service}-${item.id}`} item={item} />
        ))}
      </div>
    </div>
  );
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const isSuccess =
    item.eventType === "grabbed" ||
    item.eventType === "downloadFolderImported" ||
    item.eventType === "episodeFileImported" ||
    item.eventType === "movieFileImported";

  return (
    <div className="flex items-center gap-3 py-1.5 group transition-all hover:pl-1">
      <div
        className="flex items-center justify-center shrink-0 rounded-[6px] text-[13px] font-bold"
        style={{
          width: 26,
          height: 26,
          background: isSuccess
            ? "color-mix(in srgb, var(--color-semantic-success) 18%, transparent)"
            : "color-mix(in srgb, var(--color-semantic-error) 18%, transparent)",
          color: isSuccess
            ? "var(--color-semantic-success)"
            : "var(--color-semantic-error)",
        }}
      >
        {isSuccess ? "✓" : "✗"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] text-text-default truncate">{item.title}</p>
        <p className="text-[11px] text-text-muted" style={{ color: "#6E6E73" }}>
          {item.eventType} · {item.quality}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <ServiceBadge service={item.service} size="sm" />
        <span
          className="font-mono tabular-nums"
          style={{ fontSize: 10, color: "#484F58" }}
        >
          {formatRelativeTime(item.date)}
        </span>
      </div>
    </div>
  );
}

// --- Main Page ---
export default function DashboardPage() {
  return (
    <div className="space-y-6 max-w-[960px]">
      <StatTilesRow />

      <div className="grid grid-cols-2 gap-[10px]">
        <UnifiedSystemTerminal />
        <InstancesPanel />
      </div>

      <DownloadsSection />

      <ActivitySection />
    </div>
  );
}
