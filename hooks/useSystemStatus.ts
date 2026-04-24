"use client";

import { useQuery } from "@tanstack/react-query";
import type { SystemStatus } from "@/types/common";

async function fetchSystemStatus(): Promise<SystemStatus> {
  const res = await fetch("/api/status");
  if (!res.ok) throw new Error("Failed to fetch system status");
  return res.json();
}

export function useSystemStatus() {
  return useQuery<SystemStatus>({
    queryKey: ["system-status"],
    queryFn: fetchSystemStatus,
    refetchInterval: 30_000,
  });
}
