import { Suspense } from "react";
import { CropCostsClient } from "./crop-costs-client";

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
}: PageProps<"/farm/crops/[cropId]/costs">) {
  return (
    <Suspense fallback={<Loading />}>
      {params.then(({ cropId }) => (
        <CropCostsClient cropId={cropId} />
      ))}
    </Suspense>
  );
}
