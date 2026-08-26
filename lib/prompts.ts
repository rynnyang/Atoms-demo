// System + user prompt builders for the Qwen code-generation pipeline.

const BASE_RULES = `You are an expert frontend engineer inside an AI app builder.

Your task is to create or modify a complete, self-contained web application.

REQUIREMENTS:
1. Return one complete HTML document.
2. Put all CSS inside a single <style> block in <head>.
3. Put all JavaScript inside a single <script> block before </body>.
4. Do NOT use external libraries, CDNs, fonts, or images.
5. Do NOT make any external network requests.
6. Do NOT use npm packages or build steps.
7. The app must run directly inside an <iframe> via srcDoc.
8. Every visible button, input and control must actually work.
9. The design must be polished, responsive and look professional.
10. For apps that need to remember data (todos, expenses, notes, settings),
    use localStorage, but wrap access in try/catch because the iframe may
    run in a restricted sandbox where localStorage is unavailable.
11. Do NOT return Markdown code fences (no \`\`\`html).
12. Do NOT explain the code.
13. Return ONLY the final HTML document, starting with <!DOCTYPE html>.`;

export function buildGenerateSystem(): string {
  return BASE_RULES;
}

export function buildGenerateUser(prompt: string): string {
  return `Create a complete, self-contained web application from this request:

"${prompt}"

Make it genuinely interactive and good-looking. Prefer a single clean layout.
Return only the HTML document.`;
}

export function buildModifySystem(): string {
  return BASE_RULES;
}

export function buildModifyUser(prompt: string, currentHtml: string): string {
  return `The user wants to modify an existing application.

USER REQUEST:
${prompt}

CURRENT HTML:
${currentHtml}

Preserve all existing functionality unless the user explicitly asks to remove it.
Apply the requested change while keeping the app working.
Return the complete, updated HTML document only. No explanations, no Markdown fences.`;
}

// Derive a short project name from the user prompt (used when calling the real model
// and no structured name is returned).
export function deriveName(prompt: string): string {
  const cleaned = prompt.replace(/\s+/g, " ").trim();
  const firstSentence = cleaned.split(/[.!?]/)[0] || cleaned;
  const words = firstSentence.split(" ").slice(0, 6).join(" ");
  if (!words) return "Untitled App";
  return words.length > 42 ? words.slice(0, 42) + "…" : words;
}
