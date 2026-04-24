import type { NextRequest } from "next/server"
import { arrFetch } from "@/lib/proxy"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const { path } = await params
  const upstream = path.join("/")
  const query = request.nextUrl.search

  const result = await arrFetch("sonarr", `/api/v3/${upstream}${query}`)

  if (result.error) {
    return Response.json({ error: result.error }, { status: result.status })
  }

  return Response.json(result.data)
}
