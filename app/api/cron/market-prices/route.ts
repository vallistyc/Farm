import { connection, NextResponse } from "next/server";
import {
  backfillIndonesia,
  backfillMonth,
  refreshIndonesiaHistory,
  refreshMarketHistory,
} from "@/lib/market-server";

export const maxDuration = 60;

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

  const params = new URL(request.url).searchParams;
  const month = params.get("month");
  const country = params.get("country");
  const days = params.get("days");

  try {
    if (country) {
      if (country !== "id") {
        return NextResponse.json({ error: "bad_country" }, { status: 400 });
      }

      if (days) {
        const dayCount = Number(days);
        if (
          !Number.isInteger(dayCount) ||
          dayCount < 1 ||
          dayCount > 60
        ) {
          return NextResponse.json({ error: "bad_days" }, { status: 400 });
        }
        const saved = await backfillIndonesia(dayCount);
        return NextResponse.json({
          ok: true,
          country: "id",
          days: dayCount,
          saved,
        });
      }

      const { saved, snapshot } = await refreshIndonesiaHistory();
      return NextResponse.json({
        ok: true,
        country: "id",
        observedAt: snapshot.observedAt,
        liveCount: snapshot.liveCount,
        saved,
      });
    }

    if (month) {
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
        return NextResponse.json({ error: "bad_month" }, { status: 400 });
      }
      const saved = await backfillMonth(month);
      return NextResponse.json({ ok: true, month, saved });
    }

    const [malaysia, indonesia] = await Promise.all([
      refreshMarketHistory(),
      refreshIndonesiaHistory().catch((error) => {
        console.error(
          "Indonesia market refresh failed",
          error instanceof Error ? error.message : "unknown",
        );
        return null;
      }),
    ]);

    return NextResponse.json({
      ok: true,
      observedAt: malaysia.snapshot.observedAt,
      liveCount: malaysia.snapshot.liveCount,
      saved: malaysia.saved,
      indonesia: indonesia
        ? {
            observedAt: indonesia.snapshot.observedAt,
            liveCount: indonesia.snapshot.liveCount,
            saved: indonesia.saved,
          }
        : { error: "upstream" },
    });
  } catch (error) {
    console.error(
      "Market refresh failed",
      error instanceof Error ? error.message : "unknown",
    );
    return NextResponse.json({ error: "upstream" }, { status: 502 });
  }
}
