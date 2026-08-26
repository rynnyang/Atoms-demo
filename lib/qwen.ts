// Server-side Qwen client (OpenAI-compatible / DashScope compatible-mode).
// API key stays on the server; the browser never calls the model directly.

export interface QwenMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Call the Qwen chat-completions endpoint and return the raw assistant text.
 * Throws if the key is missing or the request fails.
 */
export async function callQwen(
  system: string,
  user: string,
  opts?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) {
    throw new Error("DASHSCOPE_API_KEY is not configured on the server.");
  }

  const baseUrl =
    process.env.QWEN_BASE_URL?.replace(/\/$/, "") ||
    "https://dashscope.aliyuncs.com/compatible-mode/v1";
  const model = process.env.QWEN_MODEL || "qwen3-coder-next";

  const messages: QwenMessage[] = [
    { role: "system", content: system },
    { role: "user", content: user },
  ];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: opts?.temperature ?? 0.7,
        max_tokens: opts?.maxTokens ?? 8000,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Qwen API error ${res.status}: ${text.slice(0, 300)}`);
    }

    const json = await res.json();
    const content: string =
      json?.choices?.[0]?.message?.content ?? "";
    if (!content || typeof content !== "string") {
      throw new Error("Qwen returned an empty response.");
    }
    return cleanHtml(content);
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Strip reasoning blocks (qwen3 <think>...</think>), Markdown code fences and
 * surrounding whitespace so we always get a raw HTML document.
 */
export function cleanHtml(raw: string): string {
  let out = raw;
  // Remove <think>...</think> reasoning blocks (qwen3-coder / qwen3).
  out = out.replace(/<think>[\s\S]*?<\/think>/gi, "");
  // Remove ```html ... ``` or ``` ... ``` fences.
  out = out.replace(/```(?:html|HTML)?\s*/gi, "");
  out = out.replace(/```\s*$/gi, "");
  out = out.trim();
  return out;
}

export function validateHtml(html: string): boolean {
  return /<!doctype\s+html/i.test(html) || /<html[\s>]/i.test(html);
}
