import test from "node:test";
import assert from "node:assert/strict";
import {
  MAX_MESSAGE_LENGTH,
  isCommunityRoomId,
  parseCommunityMessages,
} from "./community.ts";

const VALID = {
  id: "m1",
  room_id: "padi",
  author_id: "farmer-ahmad",
  author_name: "Ahmad",
  body: "Harga gabah naik hari ini.",
  created_at: "2026-11-22T03:00:00.000Z",
};

test("isCommunityRoomId accepts known rooms only", () => {
  assert.equal(isCommunityRoomId("padi"), true);
  assert.equal(isCommunityRoomId("chilli"), true);
  assert.equal(isCommunityRoomId("beginners"), true);
  assert.equal(isCommunityRoomId("unknown"), false);
});

test("parseCommunityMessages keeps valid rows and sorts by time", () => {
  const later = {
    ...VALID,
    id: "m2",
    created_at: "2026-11-22T04:00:00.000Z",
  };
  const parsed = parseCommunityMessages([later, VALID]);

  assert.deepEqual(
    parsed.map((message) => message.id),
    ["m1", "m2"],
  );
  assert.equal(parsed[0].roomId, "padi");
  assert.equal(parsed[0].authorName, "Ahmad");
});

test("parseCommunityMessages drops malformed rows", () => {
  const parsed = parseCommunityMessages([
    VALID,
    null,
    {},
    { ...VALID, id: "" },
    { ...VALID, room_id: "unknown" },
    { ...VALID, body: "   " },
    { ...VALID, body: "x".repeat(MAX_MESSAGE_LENGTH + 1) },
    { ...VALID, created_at: "not-a-date" },
  ]);

  assert.deepEqual(
    parsed.map((message) => message.id),
    ["m1"],
  );
});

test("parseCommunityMessages returns an empty list for non-arrays", () => {
  assert.deepEqual(parseCommunityMessages(null), []);
  assert.deepEqual(parseCommunityMessages({}), []);
});
