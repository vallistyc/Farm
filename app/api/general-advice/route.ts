import { NextResponse } from "next/server";
import {
  buildGeneralSystemPrompt,
  buildGeneralUserPrompt,
  parseGeneralAdviceInput,
  parseGeneralAdviceReply,
} from "@/lib/general-advice";
import { readProviders, requestAdvice } from "@/lib/ai-providers";

export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const input = parseGeneralAdviceInput(raw);
  if (!input) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const providers = readProviders(process.env);
  if (providers.length === 0) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const result = await requestAdvice(
    providers,
    buildGeneralSystemPrompt(input.language),
    buildGeneralUserPrompt(input),
  );
  if (!result) {
    return NextResponse.json({ error: "upstream" }, { status: 502 });
  }

  const advice = parseGeneralAdviceReply(result.reply);
  if (!advice) {
    return NextResponse.json({ error: "invalid_json" }, { status: 502 });
  }

  return NextResponse.json(advice);
}
