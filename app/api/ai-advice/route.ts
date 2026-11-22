import { NextResponse } from "next/server";
import {
  buildSystemPrompt,
  buildUserPrompt,
  parseAdviceRequest,
  type AdviceError,
} from "@/lib/ai";
import { readProviders, requestAdvice } from "@/lib/ai-providers";

function errorResponse(error: AdviceError, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return errorResponse("bad_request", 400);
  }

  const payload = parseAdviceRequest(raw);
  if (!payload) return errorResponse("bad_request", 400);

  const providers = readProviders(process.env);
  if (providers.length === 0) return errorResponse("not_configured", 503);

  const result = await requestAdvice(
    providers,
    buildSystemPrompt(payload.locale),
    buildUserPrompt(payload),
  );

  if (!result) return errorResponse("upstream", 502);

  return NextResponse.json({
    reply: result.reply,
    provider: result.provider,
    model: result.model,
  });
}
