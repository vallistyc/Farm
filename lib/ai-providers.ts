export type ProviderName = "openrouter" | "gemini" | "groq";

export type ProviderConfig = {
  name: ProviderName;
  key: string;
  model: string;
};

export type ProviderResponse = {
  reply: string;
  provider: ProviderName;
  model: string;
};

export const DEFAULT_OPENROUTER_MODELS = [
  "nvidia/nemotron-3-ultra-550b-a55b:free",
  "baidu/ernie-5.5-flash-preview:free",
  "nvidia/nemotron-3.5-super-vl:free",
  "nvidia/nemotron-3.5-lightning:free",
  "particle-ai/particle-1:free",
  "inclusionai/ling-3.2-flash:free",
  "recursive/flint-v1.0:free",
  "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
  "liquid/lfm-3-1.7b:free",
];

export const DEFAULT_GEMINI_MODEL = "gemini-3.1-flash-lite";
export const DEFAULT_GROQ_MODEL = "openai/gpt-oss-120b";

const MAX_OUTPUT_TOKENS = 900;

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models";

type Env = Record<string, string | undefined>;

export function parseModelList(raw: string | undefined): string[] {
  if (!raw) return [];
  const seen = new Set<string>();
  const models: string[] = [];
  for (const part of raw.split(",")) {
    const model = part.trim();
    if (!model || seen.has(model)) continue;
    seen.add(model);
    models.push(model);
  }
  return models;
}

function readInt(raw: string | undefined, fallback: number): number {
  const value = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function readProviders(env: Env): ProviderConfig[] {
  const providers: ProviderConfig[] = [];

  const openRouterKey = env.OPENROUTER_API_KEY?.trim();
  if (openRouterKey) {
    const configured = parseModelList(env.OPENROUTER_MODELS);
    const models = configured.length > 0 ? configured : DEFAULT_OPENROUTER_MODELS;
    const limit = readInt(env.OPENROUTER_MAX_ATTEMPTS, 3);
    for (const model of models.slice(0, limit)) {
      providers.push({ name: "openrouter", key: openRouterKey, model });
    }
  }

  const geminiKey = env.GEMINI_API_KEY?.trim();
  if (geminiKey) {
    providers.push({
      name: "gemini",
      key: geminiKey,
      model: env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL,
    });
  }

  const groqKey = env.GROQ_API_KEY?.trim();
  if (groqKey) {
    providers.push({
      name: "groq",
      key: groqKey,
      model: env.GROQ_MODEL?.trim() || DEFAULT_GROQ_MODEL,
    });
  }

  return providers;
}

export type ProviderRequest = {
  url: string;
  headers: Record<string, string>;
  body: unknown;
};

export function buildProviderRequest(
  provider: ProviderConfig,
  system: string,
  user: string,
): ProviderRequest {
  if (provider.name === "gemini") {
    return {
      url: `${GEMINI_URL}/${encodeURIComponent(provider.model)}:generateContent`,
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": provider.key,
      },
      body: {
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: MAX_OUTPUT_TOKENS },
      },
    };
  }

  const url = provider.name === "groq" ? GROQ_URL : OPENROUTER_URL;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${provider.key}`,
  };
  if (provider.name === "openrouter") {
    headers["HTTP-Referer"] = "https://farm-harga-jual.vercel.app";
    headers["X-Title"] = "Harga Jual Petani";
  }

  return {
    url,
    headers,
    body: {
      model: provider.model,
      temperature: 0.3,
      max_tokens: MAX_OUTPUT_TOKENS,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    },
  };
}

export function extractReply(
  provider: ProviderName,
  data: unknown,
): string | null {
  if (!data || typeof data !== "object") return null;

  if (provider === "gemini") {
    const candidates = (data as { candidates?: unknown }).candidates;
    if (!Array.isArray(candidates)) return null;
    const parts = (
      candidates[0] as { content?: { parts?: unknown } } | undefined
    )?.content?.parts;
    if (!Array.isArray(parts)) return null;
    const text = parts
      .map((part) => {
        const value = (part as { text?: unknown } | null)?.text;
        return typeof value === "string" ? value : "";
      })
      .join("")
      .trim();
    return text || null;
  }

  const choices = (data as { choices?: unknown }).choices;
  if (!Array.isArray(choices)) return null;
  const content = (
    choices[0] as { message?: { content?: unknown } } | undefined
  )?.message?.content;
  return typeof content === "string" && content.trim()
    ? content.trim()
    : null;
}

const ATTEMPT_TIMEOUT_MS = 15000;
const TOTAL_BUDGET_MS = 45000;

export async function requestAdvice(
  providers: ProviderConfig[],
  system: string,
  user: string,
): Promise<ProviderResponse | null> {
  const startedAt = Date.now();

  for (const provider of providers) {
    if (Date.now() - startedAt > TOTAL_BUDGET_MS) break;

    const request = buildProviderRequest(provider, system, user);
    try {
      const response = await fetch(request.url, {
        method: "POST",
        cache: "no-store",
        headers: request.headers,
        body: JSON.stringify(request.body),
        signal: AbortSignal.timeout(ATTEMPT_TIMEOUT_MS),
      });

      if (!response.ok) {
        console.warn(
          `AI provider ${provider.name}/${provider.model} responded ${response.status}`,
        );
        continue;
      }

      const data = await response.json().catch(() => null);
      const reply = extractReply(provider.name, data);
      if (!reply) {
        console.warn(
          `AI provider ${provider.name}/${provider.model} returned no text`,
        );
        continue;
      }

      return { reply, provider: provider.name, model: provider.model };
    } catch (error) {
      console.warn(
        `AI provider ${provider.name}/${provider.model} failed: ${
          error instanceof Error ? error.message : "unknown"
        }`,
      );
    }
  }

  return null;
}
