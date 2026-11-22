import { Suspense } from "react";
import { AiAdviceClient } from "./ai-advice-client";

function Loading() {
  return (
    <div
      aria-hidden="true"
      className="h-40 animate-pulse rounded-2xl bg-surface-muted"
    />
  );
}

export default function Page({ searchParams }: PageProps<"/ai-advice">) {
  return (
    <Suspense fallback={<Loading />}>
      {searchParams.then((params) => (
        <AiAdviceClient
          cropId={typeof params.crop === "string" ? params.crop : undefined}
        />
      ))}
    </Suspense>
  );
}
