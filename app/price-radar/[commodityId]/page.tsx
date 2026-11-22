import { Suspense } from "react";
import { PriceRadarDetailClient } from "./price-radar-detail-client";

function Loading() {
  return (
    <div
      aria-hidden="true"
      className="h-40 animate-pulse rounded-2xl bg-surface-muted"
    />
  );
}

export default function Page({
  params,
}: PageProps<"/price-radar/[commodityId]">) {
  return (
    <Suspense fallback={<Loading />}>
      {params.then(({ commodityId }) => (
        <PriceRadarDetailClient commodityId={commodityId} />
      ))}
    </Suspense>
  );
}
