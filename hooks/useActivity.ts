"use client";

import { useQuery } from "@tanstack/react-query";
import type { ActivityItem } from "@/types/common";
import type { SonarrHistoryResponse } from "@/types/sonarr";
import type { RadarrHistoryResponse } from "@/types/radarr";

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
