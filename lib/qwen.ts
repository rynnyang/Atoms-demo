// Server-only Qwen client for the OpenAI-compatible Chat Completions API.
// Never import this module from a client component.

interface QwenMessage {
  role: "system" | "user";
  content: string;
}

const MAX_HTML_LENGTH = 160_000;

export async function callQwen(
  system: string,
  user: string,
  options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const apiKey = process.env.DASHSCOPE_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("DASHSCOPE_API_KEY is not configured on the server.");
  }

  const baseUrl = (
    process.env.QWEN_BASE_URL ||
    "https://dashscope.aliyuncs.com/compatible-mode/v1"
  ).replace(/\/$/, "");
  const model = process.env.QWEN_MODEL || "qwen3.7-flash";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);
  const messages: QwenMessage[] = [
    { role: "system", content: system },
    { role: "user", content: user },
  ];

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options?.temperature ?? 0.4,
        max_tokens: options?.maxTokens ?? 8_000,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const details = await response.text().catch(() => "");
      throw new Error(`Qwen API error ${response.status}: ${details.slice(0, 300)}`);
    }

    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      throw new Error("Qwen returned an empty response.");
    }
    return cleanHtml(content);
  } finally {
    clearTimeout(timeout);
  }
}

export function cleanHtml(raw: string): string {
  return raw
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/```(?:html)?\s*/gi, "")
    .replace(/```\s*$/g, "")
    .trim();
}

export function validateHtml(html: string): boolean {
  const normalized = html.trim();
  return (
    normalized.length >= 100 &&
    normalized.length <= MAX_HTML_LENGTH &&
    /<!doctype\s+html/i.test(normalized) &&
    /<html[\s>]/i.test(normalized) &&
    /<\/html>/i.test(normalized)
  );
}

export function deriveName(prompt: string): string {
  const compact = prompt.replace(/\s+/g, " ").trim();
  const firstSentence = compact.split(/[.!?。！？]/)[0] || compact;
  const words = firstSentence.split(" ").slice(0, 6).join(" ");
  if (!words) return "Untitled App";
  return words.length > 42 ? `${words.slice(0, 42)}…` : words;
}
