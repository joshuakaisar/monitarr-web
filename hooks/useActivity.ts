"use client";

import { useQuery } from "@tanstack/react-query";
import type { ActivityItem } from "@/types/common";
import type { ActivityEvent, ActivityGroup, ActivityEventType } from "@/types/common";
import type { SonarrHistoryResponse } from "@/types/sonarr";
import type { RadarrHistoryResponse } from "@/types/radarr";

function normalizeEventType(raw: string): ActivityEventType {
  if (raw === "grabbed") return "grabbed";
  if (
    raw === "downloadFolderImported" ||
    raw === "episodeFileImported" ||
    raw === "movieFileImported"
  )
    return "imported";
  if (raw === "downloadFailed") return "failed";
  if (raw === "episodeFileDeleted" || raw === "movieFileDeleted" || raw === "deleted")
    return "deleted";
  if (raw === "episodeFileRenamed" || raw === "movieFileRenamed" || raw === "renamed")
    return "renamed";
  return "grabbed";
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "";
  const gb = bytes / 1024 ** 3;
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  const mb = bytes / 1024 ** 2;
  return `${mb.toFixed(0)} MB`;
}

function buildSubtitle(
  eventType: ActivityEventType,
  quality: string,
  size?: number,
): string {
  const parts: string[] = [];
  const label =
    eventType === "grabbed"
      ? "Grabbed"
      : eventType === "imported"
        ? "Imported"
        : eventType === "failed"
          ? "Failed"
          : eventType === "deleted"
            ? "Deleted"
            : "Renamed";
  parts.push(label);
  if (quality && quality !== "Unknown") parts.push(quality);
  if (size && size > 0) parts.push(formatSize(size));
  return parts.join(" · ");
}

function getDayKey(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor(
    (startOfToday.getTime() - startOfDate.getTime()) / 86_400_000,
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) {
    return date.toLocaleDateString("en-US", { weekday: "long" });
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

async function fetchActivityEvents(): Promise<ActivityEvent[]> {
  const [sonarrRes, radarrRes] = await Promise.allSettled([
    fetch(
      "/api/sonarr/api/v3/history?pageSize=100&sortKey=date&sortDirection=descending&includeSeries=true",
    ),
    fetch(
      "/api/radarr/api/v3/history?pageSize=100&sortKey=date&sortDirection=descending&includeMovie=true",
    ),
  ]);

  const events: ActivityEvent[] = [];

  if (sonarrRes.status === "fulfilled" && sonarrRes.value.ok) {
    const data: SonarrHistoryResponse = await sonarrRes.value.json();
    for (const r of data.records) {
      const eventType = normalizeEventType(r.eventType);
      const quality = r.quality?.quality?.name ?? "Unknown";
      const size = r.data?.size ? Number(r.data.size) : undefined;
      events.push({
        id: `sonarr-${r.id}`,
        title: r.series?.title ?? r.sourceTitle,
        subtitle: buildSubtitle(eventType, quality, size),
        service: "sonarr",
        eventType,
        quality,
        date: r.date,
        size,
        indexer: r.data?.indexer,
        releaseTitle: r.data?.releaseTitle ?? r.sourceTitle,
      });
    }
  }

  if (radarrRes.status === "fulfilled" && radarrRes.value.ok) {
    const data: RadarrHistoryResponse = await radarrRes.value.json();
    for (const r of data.records) {
      const eventType = normalizeEventType(r.eventType);
      const quality = r.quality?.quality?.name ?? "Unknown";
      const size = r.data?.size ? Number(r.data.size) : undefined;
      events.push({
        id: `radarr-${r.id}`,
        title: r.movie?.title ?? r.sourceTitle,
        subtitle: buildSubtitle(eventType, quality, size),
        service: "radarr",
        eventType,
        quality,
        date: r.date,
        size,
        indexer: r.data?.indexer,
        releaseTitle: r.data?.releaseTitle ?? r.sourceTitle,
      });
    }
  }

  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return events;
}

function groupByDay(events: ActivityEvent[]): ActivityGroup[] {
  const map = new Map<string, ActivityEvent[]>();

  for (const event of events) {
    const key = getDayKey(event.date);
    const list = map.get(key);
    if (list) {
      list.push(event);
    } else {
      map.set(key, [event]);
    }
  }

  return Array.from(map.entries()).map(([date, evts]) => ({
    date,
    events: evts,
  }));
}

export function useActivityEvents() {
  const query = useQuery<ActivityEvent[]>({
    queryKey: ["activity-events"],
    queryFn: fetchActivityEvents,
    refetchInterval: 30_000,
  });

  const events = query.data ?? [];
  const groups = groupByDay(events);

  return {
    groups,
    isLoading: query.isLoading,
    isError: query.isError,
    totalCount: events.length,
  };
}

// Keep the old hook for backward compat (dashboard uses it)
async function fetchActivity(): Promise<ActivityItem[]> {
  const [sonarrRes, radarrRes] = await Promise.allSettled([
    fetch("/api/sonarr/api/v3/history?pageSize=20&sortKey=date&sortDirection=descending"),
    fetch("/api/radarr/api/v3/history?pageSize=20&sortKey=date&sortDirection=descending"),
  ]);

  const items: ActivityItem[] = [];

  if (sonarrRes.status === "fulfilled" && sonarrRes.value.ok) {
    const data: SonarrHistoryResponse = await sonarrRes.value.json();
    for (const r of data.records) {
      items.push({
        id: r.id,
        title: r.series?.title ?? r.sourceTitle,
        eventType: r.eventType,
        service: "sonarr",
        date: r.date,
        quality: r.quality?.quality?.name ?? "Unknown",
      });
    }
  }

  if (radarrRes.status === "fulfilled" && radarrRes.value.ok) {
    const data: RadarrHistoryResponse = await radarrRes.value.json();
    for (const r of data.records) {
      items.push({
        id: r.id,
        title: r.movie?.title ?? r.sourceTitle,
        eventType: r.eventType,
        service: "radarr",
        date: r.date,
        quality: r.quality?.quality?.name ?? "Unknown",
      });
    }
  }

  items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return items;
}

export function useActivity() {
  return useQuery<ActivityItem[]>({
    queryKey: ["activity"],
    queryFn: fetchActivity,
    refetchInterval: 30_000,
  });
}
