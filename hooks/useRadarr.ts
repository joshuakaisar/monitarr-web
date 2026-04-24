"use client";

import { useQuery } from "@tanstack/react-query";
import type { RadarrMovie, RadarrWantedResponse } from "@/types/radarr";

type RadarrStats = {
  movieCount: number;
  wanted: number;
  diskSpace: number;
};

async function fetchRadarrStats(): Promise<RadarrStats> {
  const [moviesRes, wantedRes] = await Promise.all([
    fetch("/api/radarr/api/v3/movie"),
    fetch("/api/radarr/api/v3/wanted/missing?pageSize=1"),
  ]);

  if (!moviesRes.ok || !wantedRes.ok) {
    throw new Error("Failed to fetch Radarr stats");
  }

  const movies: RadarrMovie[] = await moviesRes.json();
  const wanted: RadarrWantedResponse = await wantedRes.json();

  const diskSpace = movies.reduce((sum, m) => sum + (m.sizeOnDisk ?? 0), 0);

  return {
    movieCount: movies.length,
    wanted: wanted.totalRecords,
    diskSpace,
  };
}

export function useRadarr() {
  return useQuery<RadarrStats>({
    queryKey: ["radarr-stats"],
    queryFn: fetchRadarrStats,
    refetchInterval: 30_000,
  });
}
