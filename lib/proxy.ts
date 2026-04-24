import { env } from "./env"

type Service = "sonarr" | "radarr" | "lidarr" | "prowlarr"

type Result<T> =
  | { data: T; error: null }
  | { data: null; error: string; status: number }

const serviceConfig = {
  sonarr: { url: () => env.SONARR_URL, key: () => env.SONARR_API_KEY },
  radarr: { url: () => env.RADARR_URL, key: () => env.RADARR_API_KEY },
  lidarr: { url: () => env.LIDARR_URL, key: () => env.LIDARR_API_KEY },
  prowlarr: { url: () => env.PROWLARR_URL, key: () => env.PROWLARR_API_KEY },
} as const

export async function arrFetch<T = unknown>(
  service: Service,
  path: string,
  options?: RequestInit,
): Promise<Result<T>> {
  const config = serviceConfig[service]
  const baseUrl = config.url()
  const apiKey = config.key()

  if (!baseUrl || !apiKey) {
    return { data: null, error: "Service not configured", status: 503 }
  }

  const url = `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10_000)

    const res = await fetch(url, {
      ...options,
      headers: {
        "X-Api-Key": apiKey,
        Accept: "application/json",
        ...options?.headers,
      },
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!res.ok) {
      return {
        data: null,
        error: `Upstream returned ${res.status}`,
        status: res.status,
      }
    }

    const data = (await res.json()) as T
    return { data, error: null }
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return { data: null, error: "Upstream request timed out", status: 504 }
    }
    return { data: null, error: "Failed to reach upstream service", status: 502 }
  }
}

export function isConfigured(service: Service): boolean {
  const config = serviceConfig[service]
  return Boolean(config.url() && config.key())
}
