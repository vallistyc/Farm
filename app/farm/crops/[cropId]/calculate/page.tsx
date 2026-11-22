import { Suspense } from "react";
import { PriceCalculatorClient } from "./price-calculator-client";

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
}: PageProps<"/farm/crops/[cropId]/calculate">) {
  return (
    <Suspense fallback={<Loading />}>
      {params.then(({ cropId }) => (
        <PriceCalculatorClient cropId={cropId} />
      ))}
    </Suspense>
  );
}
