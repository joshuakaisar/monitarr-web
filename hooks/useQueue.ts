"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type { QueueItem, QueueResponse } from "@/types/common";

async function fetchQueue(): Promise<QueueItem[]> {
  const res = await fetch("/api/queue");
  if (!res.ok) throw new Error("Failed to fetch queue");
  const data: QueueResponse = await res.json();
  return data.items;
}

export function useQueue() {
  const query = useQuery<QueueItem[]>({
    queryKey: ["queue"],
    queryFn: fetchQueue,
    refetchInterval: 15_000,
  });

  const stalledCount = useMemo(
    () => query.data?.filter((q) => q.status === "stalled").length ?? 0,
    [query.data],
  );

  const activeCount = useMemo(
    () => query.data?.filter((q) => q.status === "downloading").length ?? 0,
    [query.data],
  );

  return {
    ...query,
    items: query.data ?? [],
    stalledCount,
    activeCount,
  };
}
