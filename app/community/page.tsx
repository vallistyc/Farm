"use client";

import Link from "next/link";
import { useSettings } from "@/components/providers";
import { PageHeader } from "@/components/page-header";
import { GlyphIcon } from "@/components/icons";
import { COMMUNITY_ROOM_IDS } from "@/lib/community";

export default function CommunityPage() {
  const { t } = useSettings();

  return (
    <div>
      <PageHeader title={t.community.title} description={t.community.description} />

      <p className="mb-4 inline-flex rounded-full bg-surface-muted px-3 py-1 text-xs font-medium text-ink-muted">
        {t.community.liveNote}
      </p>

      <h2 className="mb-2 text-sm font-semibold">{t.community.roomsTitle}</h2>
      <div className="space-y-2">
        {COMMUNITY_ROOM_IDS.map((roomId) => (
          <Link
            key={roomId}
            href={`/community/${roomId}`}
            className="flex min-h-16 items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 transition-colors hover:bg-surface-muted"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
              <GlyphIcon name="chat" className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {t.community.rooms[roomId].name}
              </p>
              <p className="truncate text-xs text-ink-muted">
                {t.community.rooms[roomId].preview}
              </p>
            </div>
            <span className="shrink-0 text-xs font-medium text-ink-muted">
              {t.community.openRoom}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
