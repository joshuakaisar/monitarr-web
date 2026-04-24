"use client";

import { useQuery } from "@tanstack/react-query";
import type { SonarrSeries, SonarrWantedResponse } from "@/types/sonarr";

type SonarrStats = {
  seriesCount: number;
  episodeCount: number;
  wanted: number;
  diskSpace: number;
};

async function fetchSonarrStats(): Promise<SonarrStats> {
  const [seriesRes, wantedRes] = await Promise.all([
    fetch("/api/sonarr/api/v3/series"),
    fetch("/api/sonarr/api/v3/wanted/missing?pageSize=1"),
  ]);

  if (!seriesRes.ok || !wantedRes.ok) {
    throw new Error("Failed to fetch Sonarr stats");
  }

  const series: SonarrSeries[] = await seriesRes.json();
  const wanted: SonarrWantedResponse = await wantedRes.json();

  const episodeCount = series.reduce(
    (sum, s) => sum + (s.statistics?.episodeCount ?? 0),
    0,
  );
  const diskSpace = series.reduce(
    (sum, s) => sum + (s.statistics?.sizeOnDisk ?? 0),
    0,
  );

  return {
    seriesCount: series.length,
    episodeCount,
    wanted: wanted.totalRecords,
    diskSpace,
  };
}

export function useSonarr() {
  return useQuery<SonarrStats>({
    queryKey: ["sonarr-stats"],
    queryFn: fetchSonarrStats,
    refetchInterval: 30_000,
  });
}
