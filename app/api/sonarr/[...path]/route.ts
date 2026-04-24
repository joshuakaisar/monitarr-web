import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // TODO: Proxy to Sonarr API
  return NextResponse.json({ message: "Sonarr API proxy placeholder" });
}
