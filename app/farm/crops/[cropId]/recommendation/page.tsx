import { Suspense } from "react";
import { RecommendationClient } from "./recommendation-client";

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
}: PageProps<"/farm/crops/[cropId]/recommendation">) {
  return (
    <Suspense fallback={<Loading />}>
      {params.then(({ cropId }) => (
        <RecommendationClient cropId={cropId} />
      ))}
    </Suspense>
  );
}
