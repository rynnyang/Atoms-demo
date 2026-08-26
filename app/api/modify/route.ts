import { NextRequest, NextResponse } from "next/server";
import { callQwen, validateHtml } from "@/lib/qwen";
import { buildModifySystem, buildModifyUser } from "@/lib/prompts";
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
  if (!currentHtml || !validateHtml(currentHtml)) {
    return NextResponse.json(
      { error: "Missing or invalid current app code." },
      { status: 400 }
    );
  }

  try {
    let html: string;
    let summary: string;
    const demo = !process.env.DASHSCOPE_API_KEY;

    if (!demo) {
      const system = buildModifySystem();
      const user = buildModifyUser(prompt, currentHtml);
      const raw = await callQwen(system, user);
      if (!validateHtml(raw)) {
        throw new Error(
          "The model did not return a valid HTML document. Please try again."
        );
      }
      html = raw;
      summary = prompt.slice(0, 140);
    } else {
      const res = demoModify(prompt, currentHtml);
      html = res.html;
      summary = res.summary;
    }

    return NextResponse.json({ summary, html, demo });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Modification failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
