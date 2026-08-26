# Mini Atoms — AI App Builder

A focused AI app builder that turns natural-language ideas into interactive web
apps, lets you iteratively refine them through an AI agent, and persists every
project and version for continued development.

> **Natural-language prompt → AI-generated runnable web app → live preview →
> chat to modify → save → reopen later.**

Built for the "6–8 hour Mini Atoms" spec. Implementation notes and deliberate
engineering trade-offs are documented below.

---

## Features (V1 + high-value extras)

- **Generate** — describe a small web app, get a complete self-contained HTML app.
- **Live Preview** — the generated app runs inside a sandboxed `<iframe srcdoc>`.
- **Chat to modify** — keep iterating with natural language; each change produces
  a new version.
- **Projects list** — create, open and delete projects. State survives reload.
- **Version History (V2)** — every generation/modification is saved as a version;
  preview or restore any earlier version without losing history.
- **Persistence** — projects, chat history and versions persist in the browser
  (localStorage) by default. Optional Supabase schema included.
- **Preview UX** — Desktop / Tablet / Mobile width toggles, Refresh, and a
  read-only Code view.
- **Safety** — API key stays server-side; iframe runs with a restricted sandbox;
  input length + per-IP rate limiting on the generation endpoints.

---

## Tech stack

- **Next.js 14 (App Router)** + **TypeScript**
- **Tailwind CSS**
- **Qwen** via DashScope / Alibaba Cloud Model Studio OpenAI-compatible API
  (configurable model name)
- Persistence: **localStorage** (default) — upgrade path to **Supabase**

---

## Getting started

```bash
npm install
cp .env.local.example .env.local   # then fill in your Qwen key
npm run dev
# open http://localhost:3000
```

### Demo mode (no API key)

If `DASHSCOPE_API_KEY` is empty, the app automatically runs in **demo mode**:
`/api/generate` and `/api/modify` return hand-built, fully functional template
apps (pomodoro, todo, expense tracker, calculator, landing page, notes,
countdown) chosen by keyword. This lets you exercise the entire
create → preview → modify → persist → version-history loop without a key.

Add a real key to switch to genuine AI generation — no code changes required.

---

## Environment variables

| Variable | Purpose |
|---|---|
| `DASHSCOPE_API_KEY` | Server-side Qwen key. Never exposed to the browser. |
| `QWEN_BASE_URL` | OpenAI-compatible endpoint. Defaults to China DashScope. |
| `QWEN_MODEL` | Model name, e.g. `qwen3-coder-next` (default) or `qwen3-coder-plus`. |
| `NEXT_PUBLIC_SUPABASE_URL` | (Optional) Supabase upgrade. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (Optional) Supabase upgrade. |
| `SUPABASE_SERVICE_ROLE_KEY` | (Optional) Supabase upgrade, server-only. |

---

## How it works

```
Prompt
  → POST /api/generate  (or /api/modify)
  → Qwen (OpenAI-compatible)  → self-contained HTML
  → <iframe srcdoc> live preview
  → save project + messages + version (localStorage)
  → chat to modify → new version → preview updates
```

- `app/api/generate/route.ts` — first build of an app.
- `app/api/modify/route.ts` — modifies the current app given the new request.
- `lib/qwen.ts` — server-side Qwen client (key stays on server), output cleaning
  (strips `<think>` reasoning and Markdown fences) and HTML validation.
- `lib/demo.ts` — offline template engine used when no key is configured.
- `lib/store.ts` — client-side localStorage persistence.
- `components/*` — `ProjectSidebar`, `AgentChat`, `AgentStatus`, `PromptInput`,
  `AppPreview`, `VersionHistory`.
- `app/page.tsx` — three-column workspace orchestrator.

---

## Security & reliability

- **API key is server-only.** The browser never calls the model directly.
- **iframe sandbox** uses `allow-scripts allow-same-origin`. `allow-same-origin`
  is required so generated apps can use `localStorage` (Demo Case 2: expenses
  persist after refresh). Because the iframe is same-origin with the builder,
  generated code could in principle touch the parent — acceptable for a demo
  where users generate their own apps. For untrusted multi-user deployments, host
  the preview on a separate origin or drop `allow-same-origin` and wrap
  generated `localStorage` access in `try/catch` (already done in templates).
- **Input validation** — prompts are length-capped (2000 chars) and the model
  output is validated to be an HTML document before being rendered.
- **Rate limiting** — simple in-memory per-IP limit (20/hr) on the API routes.
  For production, back this with a shared store (Redis / Upstash).

---

## Deployment (Vercel)

1. Push this repo to GitHub.
2. Import it in Vercel, set the environment variables above.
3. Deploy. No database required for V1 (localStorage persistence).
4. Reviewers open the URL, type an idea, click **Build**, and use the app — no
   API key, no install, no setup.

To upgrade to a real database, run `supabase/schema.sql`, set the Supabase env
vars, and implement `lib/supabase.ts` (the localStorage layer in `lib/store.ts`
is the reference for the data shape).

---

## Deliberate trade-offs (per the 6–8h spec)

- **Self-contained HTML, not React projects.** Avoids npm install / build
  sandboxes inside the runtime, maximizes generation success and instant preview.
- **Single LLM call per action** (no real multi-agent), surfaced as clear Agent
  status stages (Understanding → Planning → Building → Ready).
- **localStorage over Supabase for V1** to guarantee zero-setup, reload-safe
  persistence on a stateless deploy; Supabase path documented for upgrade.
- **Authentication deprioritized** to keep focus on the core generation,
  iteration, preview and persistence workflow.
