import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function proxy(request: NextRequest) {
  const authEnabled = process.env.AUTH_ENABLED === "true"

  if (!authEnabled) {
    return NextResponse.next()
  }

  const { pathname } = request.nextUrl
  if (pathname === "/api/health") {
    return NextResponse.next()
  }

  const authorization = request.headers.get("authorization")

  if (authorization) {
    const [scheme, encoded] = authorization.split(" ")
    if (scheme === "Basic" && encoded) {
      const decoded = atob(encoded)
      const password = decoded.split(":").slice(1).join(":")
      if (password === process.env.AUTH_PASSWORD) {
        return NextResponse.next()
      }
    }
  }

  return new NextResponse("Unauthorized", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Monitarr"' },
  })
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
