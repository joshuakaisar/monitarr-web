const startedAt = new Date().toISOString();

export async function GET() {
  return Response.json({ status: "ok", version: "1.0.0", uptime: startedAt });
}
