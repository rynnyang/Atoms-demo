import { NextRequest, NextResponse } from "next/server";
import { demoModify } from "@/lib/demo";
import { rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_PROMPT = 2000;

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "local";

  if (!rateLimit(ip)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please try again later." },
      { status: 429 }
    );
  }

  let body: { prompt?: unknown; currentHtml?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const prompt = (typeof body.prompt === "string" ? body.prompt : "")
    .slice(0, MAX_PROMPT)
    .trim();
  const currentHtml = typeof body.currentHtml === "string" ? body.currentHtml : "";

  if (!prompt) {
    return NextResponse.json(
      { error: "Describe the change you want." },
      { status: 400 }
    );
  }
  if (!currentHtml || !looksLikeHtml(currentHtml)) {
    return NextResponse.json(
      { error: "Missing or invalid current app code." },
      { status: 400 }
    );
  }

  try {
    // Kept local and deterministic so the demo has no API key or usage cost.
    const res = demoModify(prompt, currentHtml);
    return NextResponse.json({ ...res, demo: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Modification failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function looksLikeHtml(html: string): boolean {
  return /<!doctype\s+html/i.test(html) || /<html[\s>]/i.test(html);
}
