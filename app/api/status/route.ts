import { arrFetch, isConfigured } from "@/lib/proxy"

type ServiceStatus = {
  connected: boolean
  version: string | null
  error?: string
}

type StatusResponse = Record<
  "sonarr" | "radarr" | "lidarr" | "prowlarr",
  ServiceStatus
>

const services = ["sonarr", "radarr", "lidarr", "prowlarr"] as const

async function checkService(
  service: (typeof services)[number],
): Promise<ServiceStatus> {
  if (!isConfigured(service)) {
    return { connected: false, version: null, error: "Not configured" }
  }

  const apiVersion = service === "lidarr" || service === "prowlarr" ? "v1" : "v3"
  const result = await arrFetch<{ version: string }>(
    service,
    `/api/${apiVersion}/system/status`,
  )

  if (result.error !== null) {
    return { connected: false, version: null, error: result.error }
  }

  return { connected: true, version: result.data.version }
}

export async function GET(): Promise<Response> {
  const results = await Promise.allSettled(
    services.map((s) => checkService(s)),
  )

  const status = {} as StatusResponse
  services.forEach((service, i) => {
    const result = results[i]
    status[service] =
      result.status === "fulfilled"
        ? result.value
        : { connected: false, version: null, error: "Unexpected failure" }
  })

  return Response.json(status)
}
