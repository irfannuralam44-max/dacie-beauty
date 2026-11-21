import { assertServerEnv } from "@/lib/env/server";

export const dynamic = "force-dynamic";

export function GET() {
  try {
    assertServerEnv();
  } catch {
    return Response.json({ status: "unavailable" }, { status: 503 });
  }

  return Response.json({ status: "ok" });
}
