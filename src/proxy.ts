import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const mode = process.env.APP_MODE;
  const { pathname } = request.nextUrl;

  // Fail-closed: mode tidak valid/tidak ada tidak boleh membuka route apa pun.
  if (mode !== "public" && mode !== "private") {
    return new NextResponse(null, { status: 404 });
  }

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