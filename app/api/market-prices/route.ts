import { connection, NextResponse } from "next/server";
import { getMarketSnapshot } from "@/lib/market-server";

export async function GET() {
  await connection();
  const snapshot = await getMarketSnapshot();
  return NextResponse.json(snapshot, {
    headers: {
      "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=1800",
    },
  });
}
