import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // TODO: Proxy to Radarr API
  return NextResponse.json({ message: "Radarr API proxy placeholder" });
}
