import { arrFetch, isConfigured } from "@/lib/proxy"

export type QueueItem = {
  id: number
  title: string
  service: "sonarr" | "radarr" | "lidarr"
  status: string
  progress: number
  eta: string | null
  size: number
  quality: string
}

type QueueResponse = {
  items: QueueItem[]
  totalCount: number
}

type ArrQueueRecord = {
  id: number
  title?: string
  status: string
  trackedDownloadStatus?: string
  sizeleft?: number
  size?: number
  estimatedCompletionTime?: string | null
  quality?: { quality?: { name?: string } }
  series?: { title?: string }
  movie?: { title?: string }
  album?: { title?: string }
}

type ArrQueueResponse = {
  records: ArrQueueRecord[]
  totalRecords: number
}

const queueServices = ["sonarr", "radarr", "lidarr"] as const

function normalizeItem(
  record: ArrQueueRecord,
  service: (typeof queueServices)[number],
): QueueItem {
  const total = record.size ?? 0
  const left = record.sizeleft ?? 0
  const progress = total > 0 ? ((total - left) / total) * 100 : 0
  const title =
    record.title ??
    record.series?.title ??
    record.movie?.title ??
    record.album?.title ??
    "Unknown"

  return {
    id: record.id,
    title,
    service,
    status: record.trackedDownloadStatus ?? record.status,
    progress: Math.round(progress * 100) / 100,
    eta: record.estimatedCompletionTime ?? null,
    size: total,
    quality: record.quality?.quality?.name ?? "Unknown",
  }
}

async function fetchQueue(
  service: (typeof queueServices)[number],
): Promise<QueueItem[]> {
  if (!isConfigured(service)) return []

  const apiVersion = service === "lidarr" ? "v1" : "v3"
  const result = await arrFetch<ArrQueueResponse>(
    service,
    `/api/${apiVersion}/queue?pageSize=50&includeUnknownSeriesItems=true`,
  )

  if (result.error !== null) return []

  return result.data.records.map((r) => normalizeItem(r, service))
}

export async function GET(): Promise<Response> {
  const results = await Promise.allSettled(
    queueServices.map((s) => fetchQueue(s)),
  )

  const items = results.flatMap((r) =>
    r.status === "fulfilled" ? r.value : [],
  )

  const response: QueueResponse = {
    items,
    totalCount: items.length,
  }

  return Response.json(response)
}
