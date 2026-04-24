import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // TODO: Proxy to Lidarr API
  return NextResponse.json({ message: "Lidarr API proxy placeholder" });
}
