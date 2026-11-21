import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function getAppMode(): "public" | "private" {
  const mode = process.env.APP_MODE;
  if (mode === "public" || mode === "private") {
    return mode;
  }
  // Fail closed: treat unknown/missing mode as public-safe? 
  // For bootstrap, default to public to avoid exposing private routes.
  return "public";
}

export function proxy(request: NextRequest) {
  const mode = getAppMode();
  const { pathname } = request.nextUrl;

  if (mode === "public" && pathname.startsWith("/rekam")) {
    return new NextResponse(null, { status: 404 });
  }

  if (mode === "private" && pathname.startsWith("/booking")) {
    return new NextResponse(null, { status: 404 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};