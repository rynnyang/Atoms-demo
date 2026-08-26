import { NextRequest, NextResponse } from "next/server";
import { generateDemo } from "@/lib/demo";
import { callQwen, deriveName, validateHtml } from "@/lib/qwen";
import { buildGenerateSystem, buildGenerateUser } from "@/lib/prompts";
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
    const hasQwenKey = Boolean(process.env.DASHSCOPE_API_KEY?.trim());
    if (hasQwenKey) {
      const html = await callQwen(buildGenerateSystem(), buildGenerateUser(prompt));
      if (!validateHtml(html)) {
        throw new Error("The model did not return a complete HTML document. Please retry.");
      }
      return NextResponse.json({
        name: deriveName(prompt),
        summary: "Generated with Qwen LLM",
        html,
        demo: false,
      });
    }

    // Keep a zero-configuration fallback for reviewers and local development.
    const res = generateDemo(prompt);
    return NextResponse.json({ ...res, demo: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Generation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
