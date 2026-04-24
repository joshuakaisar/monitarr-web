"use client";

import { useQuery } from "@tanstack/react-query";
import type { QueueItem, QueueResponse } from "@/types/common";

async function fetchQueue(): Promise<QueueItem[]> {
  const res = await fetch("/api/queue");
  if (!res.ok) throw new Error("Failed to fetch queue");
  const data: QueueResponse = await res.json();
  return data.items;
}

export function useQueue() {
  return useQuery<QueueItem[]>({
    queryKey: ["queue"],
    queryFn: fetchQueue,
    refetchInterval: 15_000,
  });
}
