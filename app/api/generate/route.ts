import { NextRequest, NextResponse } from "next/server";
import { generateDemo } from "@/lib/demo";
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

  let body: { prompt?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const prompt = (typeof body.prompt === "string" ? body.prompt : "")
    .slice(0, MAX_PROMPT)
    .trim();

  if (!prompt) {
    return NextResponse.json(
      { error: "Describe what you want to build." },
      { status: 400 }
    );
  }

  try {
    // This project deliberately uses a deterministic local generation engine.
    // No third-party model request is made, even when environment variables exist.
    const res = generateDemo(prompt);
    return NextResponse.json({ ...res, demo: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Generation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
