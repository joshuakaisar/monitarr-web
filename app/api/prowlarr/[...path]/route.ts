import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // TODO: Proxy to Prowlarr API
  return NextResponse.json({ message: "Prowlarr API proxy placeholder" });
}
