import { Suspense } from "react";
import { CropDetailClient } from "./crop-detail-client";

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
}: PageProps<"/farm/crops/[cropId]">) {
  return (
    <Suspense fallback={<Loading />}>
      {params.then(({ cropId }) => (
        <CropDetailClient cropId={cropId} />
      ))}
    </Suspense>
  );
}
