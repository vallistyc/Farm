import { Suspense } from "react";
import { notFound } from "next/navigation";
import { isCommunityRoomId } from "@/lib/community";
import { CommunityChatClient } from "./community-chat-client";

function Loading() {
  return (
    <div
      aria-hidden="true"
      className="h-40 animate-pulse rounded-2xl bg-surface-muted"
    />
  );
}

export default function Page({ params }: PageProps<"/community/[roomId]">) {
  return (
    <Suspense fallback={<Loading />}>
      {params.then(({ roomId }) => {
        if (!isCommunityRoomId(roomId)) notFound();
        return <CommunityChatClient roomId={roomId} />;
      })}
    </Suspense>
  );
}
