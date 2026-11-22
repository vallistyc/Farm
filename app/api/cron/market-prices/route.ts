import { connection, NextResponse } from "next/server";
import { backfillMonth, refreshMarketHistory } from "@/lib/market-server";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  await connection();

  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const month = new URL(request.url).searchParams.get("month");

  try {
    if (month) {
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
        return NextResponse.json({ error: "bad_month" }, { status: 400 });
      }
      const saved = await backfillMonth(month);
      return NextResponse.json({ ok: true, month, saved });
    }

    const { saved, snapshot } = await refreshMarketHistory();
    return NextResponse.json({
      ok: true,
      observedAt: snapshot.observedAt,
      liveCount: snapshot.liveCount,
      saved,
    });
  } catch (error) {
    console.error(
      "Market refresh failed",
      error instanceof Error ? error.message : "unknown",
    );
    return NextResponse.json({ error: "upstream" }, { status: 502 });
  }
}
