"use client";

import { useSettings } from "@/components/providers";
import { PageHeader } from "@/components/page-header";
import { GlyphIcon } from "@/components/icons";
import { interpolate } from "@/i18n";

const ROOMS: { key: "paddy" | "chilli" | "beginners"; members: number }[] = [
  { key: "paddy", members: 128 },
  { key: "chilli", members: 86 },
  { key: "beginners", members: 54 },
];

export default function CommunityPage() {
  const { t } = useSettings();

  return (
    <div>
      <PageHeader title={t.community.title} description={t.community.description} />

      <p className="mb-4 inline-flex rounded-full bg-surface-muted px-3 py-1 text-xs font-medium text-ink-muted">
        {t.community.mockNote}
      </p>

      <h2 className="mb-2 text-sm font-semibold">{t.community.roomsTitle}</h2>
      <div className="space-y-2">
        {ROOMS.map((room) => (
          <div
            key={room.key}
            className="flex min-h-16 items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
              <GlyphIcon name="chat" className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {t.community.rooms[room.key].name}
              </p>
              <p className="truncate text-xs text-ink-muted">
                {t.community.rooms[room.key].preview}
              </p>
            </div>
            <span className="shrink-0 text-[11px] font-medium text-ink-muted">
              {interpolate(t.community.members, { count: room.members })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
