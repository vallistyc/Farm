export const COMMUNITY_ROOM_IDS = ["padi", "chilli", "beginners"] as const;

export type CommunityRoomId = (typeof COMMUNITY_ROOM_IDS)[number];

export const MAX_MESSAGE_LENGTH = 500;

export type CommunityMessage = {
  id: string;
  roomId: CommunityRoomId;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
};

export function isCommunityRoomId(value: string): value is CommunityRoomId {
  return (COMMUNITY_ROOM_IDS as readonly string[]).includes(value);
}

function readString(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) return undefined;
  return trimmed;
}

export function parseCommunityMessages(raw: unknown): CommunityMessage[] {
  if (!Array.isArray(raw)) return [];

  const messages: CommunityMessage[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const value = row as Record<string, unknown>;
    const id = readString(value.id, 80);
    const roomId = readString(value.room_id, 40);
    const authorId = readString(value.author_id, 80);
    const authorName = readString(value.author_name, 80);
    const body = readString(value.body, MAX_MESSAGE_LENGTH);
    const createdAt =
      typeof value.created_at === "string" ? value.created_at : undefined;

    if (
      !id ||
      !roomId ||
      !isCommunityRoomId(roomId) ||
      !authorId ||
      !authorName ||
      !body ||
      !createdAt ||
      Number.isNaN(Date.parse(createdAt))
    ) {
      continue;
    }

    messages.push({
      id,
      roomId,
      authorId,
      authorName,
      body,
      createdAt,
    });
  }

  return messages.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}
