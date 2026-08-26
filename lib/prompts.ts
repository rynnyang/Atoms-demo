// Prompt builders for the optional Qwen generation path.

const BASE_RULES = `You are a frontend engineer inside an AI app builder.

Create or modify one complete, self-contained web application.

Rules:
1. Return one complete HTML document beginning with <!DOCTYPE html>.
2. Put all CSS inside <style> in <head> and all JavaScript inside <script> before </body>.
3. Do not use external libraries, CDNs, images, fonts, npm packages, build steps, or network requests.
4. The app must run directly in an iframe through srcDoc.
5. Every visible control must work.
6. Use localStorage for app data when persistence is useful, wrapped in try/catch.
7. Return only the HTML document: no explanations and no Markdown fences.`;

export function buildGenerateSystem(): string {
  return BASE_RULES;
}

export function buildGenerateUser(prompt: string): string {
  return `Create a polished, genuinely interactive application for this request:

${prompt}

Return only the finished HTML document.`;
}

export function buildModifySystem(): string {
  return BASE_RULES;
}

export function buildModifyUser(prompt: string, currentHtml: string): string {
  return `Modify this existing application.

USER REQUEST:
${prompt}

CURRENT HTML:
${currentHtml}

Preserve existing functionality unless the user explicitly asks to remove it.
Return the complete updated HTML document only.`;
}
