import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_GEMINI_MODEL,
  DEFAULT_GROQ_MODEL,
  buildProviderRequest,
  extractReply,
  parseModelList,
  readProviders,
  requestAdvice,
} from "./ai-providers.ts";

test("parseModelList trims, drops blanks, and dedupes", () => {
  assert.deepEqual(parseModelList(" a , b,,a, "), ["a", "b"]);
  assert.deepEqual(parseModelList(""), []);
  assert.deepEqual(parseModelList(undefined), []);
});

test("readProviders returns nothing when no key is set", () => {
  assert.deepEqual(readProviders({}), []);
});

test("readProviders builds the OpenRouter -> Gemini -> Groq chain", () => {
  const providers = readProviders({
    OPENROUTER_API_KEY: "or-key",
    OPENROUTER_MODELS: "model-a,model-b,model-c,model-d",
    OPENROUTER_MAX_ATTEMPTS: "2",
    GEMINI_API_KEY: "gem-key",
    GROQ_API_KEY: "groq-key",
  });

  assert.deepEqual(
    providers.map((provider) => `${provider.name}:${provider.model}`),
    [
      "openrouter:model-a",
      "openrouter:model-b",
      `gemini:${DEFAULT_GEMINI_MODEL}`,
      `groq:${DEFAULT_GROQ_MODEL}`,
    ],
  );
});

test("readProviders skips providers without a key", () => {
  const providers = readProviders({ GEMINI_API_KEY: "gem-key" });
  assert.equal(providers.length, 1);
  assert.equal(providers[0].name, "gemini");
});

test("buildProviderRequest targets the right endpoint and auth header", () => {
  const openaiStyle = buildProviderRequest(
    { name: "groq", key: "k", model: "m" },
    "system",
    "user",
  );
  assert.equal(openaiStyle.url, "https://api.groq.com/openai/v1/chat/completions");
  assert.equal(openaiStyle.headers.Authorization, "Bearer k");
  assert.equal(
    (openaiStyle.body as { model: string }).model,
    "m",
  );

  const gemini = buildProviderRequest(
    { name: "gemini", key: "g", model: DEFAULT_GEMINI_MODEL },
    "system",
    "user",
  );
  assert.match(gemini.url, /gemini-2\.5-flash:generateContent$/);
  assert.equal(gemini.headers["x-goog-api-key"], "g");
  assert.equal(gemini.headers.Authorization, undefined);
});

test("extractReply reads OpenAI-compatible and Gemini shapes", () => {
  assert.equal(
    extractReply("openrouter", {
      choices: [{ message: { content: "  price is fair  " } }],
    }),
    "price is fair",
  );
  assert.equal(
    extractReply("gemini", {
      candidates: [
        { content: { parts: [{ text: "part one " }, { text: "part two" }] } },
      ],
    }),
    "part one part two",
  );
  assert.equal(extractReply("groq", { choices: [] }), null);
  assert.equal(extractReply("gemini", { candidates: [{}] }), null);
  assert.equal(extractReply("openrouter", null), null);
});

test("requestAdvice falls back to the next provider after a failure", async (t) => {
  const originalFetch = globalThis.fetch;
  const calls: string[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    calls.push(url);
    if (url.includes("openrouter")) {
      return new Response(JSON.stringify({ error: "rate limited" }), {
        status: 429,
      });
    }
    if (url.includes("generativelanguage")) {
      return new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: "Use the market price." }] } }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    return new Response(
      JSON.stringify({ choices: [{ message: { content: "wrong provider" } }] }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }) as typeof fetch;

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  const providers = readProviders({
    OPENROUTER_API_KEY: "or-key",
    OPENROUTER_MAX_ATTEMPTS: "1",
    GEMINI_API_KEY: "gem-key",
  });

  const result = await requestAdvice(providers, "system", "user");
  assert.ok(result);
  assert.equal(result.provider, "gemini");
  assert.equal(result.reply, "Use the market price.");
  assert.equal(calls.length, 2);
});

test("requestAdvice returns null when every provider fails", async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => {
    throw new Error("network down");
  }) as typeof fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  const providers = readProviders({
    OPENROUTER_API_KEY: "or-key",
    OPENROUTER_MAX_ATTEMPTS: "1",
    GROQ_API_KEY: "groq-key",
  });

  assert.equal(await requestAdvice(providers, "system", "user"), null);
});
