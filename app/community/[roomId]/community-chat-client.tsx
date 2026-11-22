"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth, useSettings } from "@/components/providers";
import { BackLink } from "@/components/back-link";
import {
  CommunityTableMissingError,
  isCloudEnabled,
  readCommunityMessages,
  sendCommunityMessage,
} from "@/lib/cloud";
import {
  MAX_MESSAGE_LENGTH,
  type CommunityMessage,
  type CommunityRoomId,
} from "@/lib/community";
import { LOCALE_TAGS } from "@/i18n";
import { formatTime } from "@/lib/format";

const POLL_MS = 5000;

type ChatStatus = "loading" | "ready" | "missing" | "error";

export function CommunityChatClient({ roomId }: { roomId: CommunityRoomId }) {
  const { t, locale } = useSettings();
  const { user } = useAuth();
  const localeTag = LOCALE_TAGS[locale];

  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>(() =>
    isCloudEnabled() ? "loading" : "missing",
  );
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inFlight = useRef(false);
  const missingRef = useRef(false);

  const load = useCallback(
    async () => {
      if (!isCloudEnabled() || inFlight.current) return;
      inFlight.current = true;
      try {
        setMessages(await readCommunityMessages(roomId));
        missingRef.current = false;
        setStatus("ready");
        setSendError(null);
      } catch (error) {
        if (error instanceof CommunityTableMissingError) {
          missingRef.current = true;
          setStatus("missing");
        } else {
          setStatus((current) => (current === "ready" ? current : "error"));
        }
      } finally {
        inFlight.current = false;
      }
    },
    [roomId],
  );

  useEffect(() => {
    if (!user || !isCloudEnabled()) return;

    const first = setTimeout(() => void load(), 0);
    const timer = setInterval(() => {
      if (document.visibilityState === "visible" && !missingRef.current) {
        void load();
      }
    }, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearTimeout(first);
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [user, load]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  if (!user) return null;

  async function submit() {
    if (!user) return;
    const body = draft.trim();
    if (!body || sending) return;
    if (!isCloudEnabled()) {
      setStatus("missing");
      return;
    }

    setSending(true);
    setSendError(null);
    try {
      await sendCommunityMessage({
        roomId,
        authorId: user.id,
        authorName: user.name,
        body,
      });
      setDraft("");
      await load();
    } catch (error) {
      if (error instanceof CommunityTableMissingError) {
        setStatus("missing");
      } else {
        setSendError(t.community.errorSend);
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="pb-2">
      <BackLink href="/community" label={t.community.backToRooms} />

      <header className="pb-3 pt-1">
        <h1 className="text-xl font-semibold tracking-tight">
          {t.community.rooms[roomId].name}
        </h1>
        <p className="mt-1 text-xs leading-relaxed text-ink-muted">
          {t.community.liveNote}
        </p>
      </header>

      {status === "missing" ? (
        <div className="rounded-2xl border border-tipis/40 bg-tipis/10 px-4 py-3">
          <p className="text-sm leading-relaxed text-ink">
            {t.community.missingTable}
          </p>
          <button
            type="button"
            onClick={() => {
              missingRef.current = false;
              setStatus("loading");
              void load();
            }}
            className="mt-3 min-h-11 text-sm font-semibold text-brand"
          >
            {t.common.retry}
          </button>
        </div>
      ) : null}

      {status === "error" ? (
        <div
          role="alert"
          className="rounded-2xl border border-rugi/30 bg-rugi/10 px-4 py-3"
        >
          <p className="text-sm leading-relaxed text-rugi">
            {t.community.errorLoad}
          </p>
          <button
            type="button"
            onClick={() => {
              setStatus("loading");
              void load();
            }}
            className="mt-3 min-h-11 text-sm font-semibold text-brand"
          >
            {t.common.retry}
          </button>
        </div>
      ) : null}

      {status === "loading" ? (
        <p className="mt-4 text-sm text-ink-muted">{t.common.loading}</p>
      ) : null}

      {status === "ready" && messages.length === 0 ? (
        <section className="mt-4 rounded-2xl border border-dashed border-line bg-surface px-4 py-6 text-center">
          <h2 className="text-base font-semibold">{t.community.emptyTitle}</h2>
          <p className="mt-1 text-sm leading-relaxed text-ink-muted">
            {t.community.emptyDescription}
          </p>
        </section>
      ) : null}

      {messages.length > 0 ? (
        <ol aria-live="polite" className="mt-4 space-y-3">
          {messages.map((message) => {
            const mine = message.authorId === user.id;
            return (
              <li
                key={message.id}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    mine
                      ? "bg-brand text-brand-ink"
                      : "border border-line bg-surface"
                  }`}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
                    {mine ? t.community.you : message.authorName} ·{" "}
                    {formatTime(message.createdAt, localeTag)}
                  </p>
                  <p className="mt-1 whitespace-pre-line break-words">
                    {message.body}
                  </p>
                </div>
              </li>
            );
          })}
          <li aria-hidden="true">
            <div ref={endRef} />
          </li>
        </ol>
      ) : null}

      {sendError ? (
        <p role="alert" className="mt-3 text-sm text-rugi">
          {sendError}
        </p>
      ) : null}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
        className="sticky bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-10 -mx-4 mt-4 border-t border-line bg-background/95 px-4 pb-2 pt-3 backdrop-blur"
      >
        <label htmlFor="community-message" className="sr-only">
          {t.community.inputLabel}
        </label>
        <div className="flex items-end gap-2">
          <textarea
            id="community-message"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={MAX_MESSAGE_LENGTH}
            rows={1}
            disabled={status === "missing"}
            placeholder={t.community.placeholder}
            className="min-h-12 flex-1 resize-none rounded-xl border border-line bg-surface px-4 py-2.5 text-base leading-relaxed outline-none placeholder:text-ink-muted focus:border-brand disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!draft.trim() || sending || status === "missing"}
            className="flex min-h-12 shrink-0 items-center justify-center rounded-xl bg-brand px-5 text-sm font-semibold text-brand-ink transition-colors disabled:opacity-60"
          >
            {t.community.send}
          </button>
        </div>
      </form>
    </div>
  );
}
