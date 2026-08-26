# Mini Atoms — Local Agent App Builder

Mini Atoms turns a short product request into a runnable, interactive web app.
It is designed as a zero-cost, deterministic alternative to an API-backed AI
builder: all generation and follow-up changes run inside this Next.js app.

## What it does

- **Generate an app:** prompts select a matching, self-contained interactive
  template: focus timer, todo list, expense tracker, calculator, countdown,
  landing page, or notes.
- **Modify an app:** local rules apply real HTML transformations for supported
  requests: dark/light and color themes, renaming, an interactive progress
  ring, and a persistent counter.
- **Live preview:** generated HTML executes in a sandboxed iframe.
- **Persistence:** projects, chat history, code, and version history are saved
  in browser localStorage and survive reloads.
- **Version history:** preview or restore any previous version without
  removing history.

This is a local rule-based agent, not an open-ended LLM. It does not make API
requests or require an API key. Unsupported edits are reported clearly instead
of being presented as completed.

## Run locally

```bash
npm ci
npm run dev
```

Open http://localhost:3000.

## Recommended demo flow

1. Build a pomodoro timer with a task list.
2. Start, pause and reset the timer; add and delete a task.
3. Ask: `Make it dark mode and add a circular progress ring.`
4. Ask: `Rename the title to Focus Flow and add a counter.`
5. Reload the page, reopen the project, preview an older version, and restore
   it.

## Architecture

```
Prompt
  -> POST /api/generate
  -> local template selection
  -> self-contained HTML
  -> iframe live preview
  -> localStorage project + message + version persistence
  -> POST /api/modify
  -> deterministic HTML transformations
```

- `lib/demo.ts` contains templates plus local generation and modification rules.
- `app/api/generate/route.ts` and `app/api/modify/route.ts` never call external
  model providers.
- `lib/store.ts` handles client-side persistence.
- `components/VersionHistory.tsx` supports version preview and restore.

## Deployment

The project has no required environment variables. Import the repository into
Vercel, select the default Next.js settings, and deploy. The deployed app stays
zero-cost with respect to LLM APIs; project data is stored per browser through
localStorage.

## Constraints and trade-offs

- The local agent supports a finite, documented set of templates and edits; it
  cannot create arbitrary code from unrestricted natural language.
- The iframe uses `allow-scripts allow-same-origin` so generated templates can
  persist their own local data. Do not treat it as an isolation boundary for
  untrusted third-party code.
- The API endpoints apply a 2,000-character prompt limit and an in-memory
  per-IP rate limit. The latter is sufficient for a small demo but not a
  distributed production quota system.
