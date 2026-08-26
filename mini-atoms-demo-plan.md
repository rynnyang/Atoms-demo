# Mini Atoms Demo — 6–8 小时实现方案

> 目标：在有限时间内实现一个“可运行、可交互、可持久化、可在线验收”的 AI App Builder Demo。  
> 核心体验：**自然语言需求 → AI 生成可运行网页 → 实时预览 → 继续对话修改 → 保存项目 → 版本恢复**。

---

## 0. 项目定位

本项目不是完整复刻 Atoms，也不是做一个只有外观的 Atoms 仿站。

要做的是一个 **Mini Atoms / AI App Builder**：

1. 用户描述想做的网页应用；
2. Agent/LLM 理解需求并生成完整 HTML/CSS/JavaScript；
3. 生成结果立即在 Preview 中真实运行；
4. 用户可以继续用自然语言修改应用；
5. 项目、聊天记录和代码可以保存；
6. 刷新页面后仍可重新打开；
7. 部署为在线网址，验收者无需配置 API Key 即可体验。

一句话介绍：

> **A focused AI app builder that turns natural-language ideas into interactive web apps, lets users iteratively refine them through an AI agent, and persists projects for continued development.**

---

# 1. 核心原则

整个项目优先保证以下闭环：

```text
Prompt
  ↓
AI Generate
  ↓
Live Preview
  ↓
User Feedback
  ↓
AI Modify
  ↓
Persist
```

如果时间不够，优先砍附加功能，不砍这个闭环。

### 必须优先保证

- 真实 LLM 调用
- 真实生成代码
- 真实 Preview
- 生成页面内部可以交互
- 可以继续修改
- 数据持久化
- 在线可访问

### 不优先

- 多 Agent 真正编排
- VS Code 级代码编辑器
- Docker Sandbox
- npm 动态安装依赖
- GitHub Sync
- Stripe
- 完整 Auth
- 多模型 Race
- 复杂后端动态生成

---

# 2. 推荐技术栈

## Frontend / Server

```text
Next.js
TypeScript
Tailwind CSS
```

推荐使用 Next.js App Router。

原因：

- 前后端可以放在一个项目；
- 可以直接写 `/api/generate`；
- API Key 留在服务端；
- Vercel 部署简单；
- UI 开发快。

---

## LLM

本项目使用 **Qwen**。

推荐按以下优先级：

### 默认模型：qwen3-coder-next

适合作为 V1 默认模型：

- 针对代码生成优化；
- 成本较低；
- 上下文足够大；
- 适合 HTML/CSS/JavaScript 生成；
- 支持后续把当前代码一起送回模型修改。

配置不要把模型名写死在代码中：

```env
QWEN_MODEL=qwen3-coder-next
```

这样后续可以直接替换：

```env
QWEN_MODEL=qwen3-coder-plus
```

而不修改业务逻辑。

### 可选升级：qwen3-coder-plus

如果测试发现 `qwen3-coder-next` 生成质量不稳定，再切换到更强的 coder 模型。

### Qwen API 接入

建议通过 Alibaba Cloud Model Studio / DashScope 的 **OpenAI-compatible API** 调用。

这样代码可以沿用 OpenAI SDK 风格，只需修改：

```text
API Key
Base URL
Model Name
```

服务端环境变量示例：

```env
DASHSCOPE_API_KEY=your_key
QWEN_BASE_URL=your_base_url
QWEN_MODEL=qwen3-coder-next
```

**不要把 API Key 放在浏览器前端。**

正确结构：

```text
Browser
   ↓
POST /api/generate
   ↓
Next.js Server
   ↓
Qwen API
```

### 当前额度注意

截至 2026-08，Alibaba Cloud Model Studio 官方文档显示：

- Singapore 国际区域的 Qwen-Coder 模型对新用户提供免费额度；
- 每个 Qwen-Coder 模型目前有 1M tokens 免费额度；
- 免费额度有效期为启用后的 90 天；
- 实际优惠和可用额度应以你的 Model Studio Console 为准。

所以在真正充值之前，先检查自己的免费额度。

官方参考：

- https://www.alibabacloud.com/help/en/model-studio/qwen-coder
- https://www.alibabacloud.com/help/en/model-studio/model-pricing
- https://www.alibabacloud.com/help/en/model-studio/what-is-model-studio

---

# 3. 数据库方案

## 最终推荐：Supabase PostgreSQL

推荐线上最终版本：

```text
Supabase PostgreSQL
```

原因：

- 免费档足够 Demo；
- 无需自己维护数据库；
- Vercel 可以直接连接；
- 后续可以扩展 Auth；
- 比 localStorage 更像真实产品；
- 可以证明工程能力和数据建模能力。

---

## localStorage 可以吗？

**可以。**

题目要求是：

> 数据持久化，不限技术方案。

因此：

```javascript
localStorage
```

理论上满足要求。

例如可以保存：

```text
projects
messages
versions
```

刷新浏览器后重新加载。

但是它存在明显限制：

- 只属于当前浏览器；
- 无真正服务端数据库；
- 清浏览器数据后消失；
- 不适合多设备；
- 产品完成度稍弱。

因此建议：

### 开发早期

```text
localStorage
```

快速跑通主流程。

### 最终提交

```text
Supabase
```

如果时间真的不够，再保留 localStorage，并在 README 中明确说明这是在 6–8 小时时限下的工程取舍。

---

## 不推荐：SQLite + Vercel

本地 SQLite 开发没问题，但部署到 Serverless 环境以后，本地文件不能当可靠持久化存储使用。

因此不要采用：

```text
Next.js
+
local SQLite file
+
Vercel
```

---

# 4. 数据模型

最终只需要三张核心表。

## projects

```sql
create table projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  initial_prompt text,
  current_code text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

用途：

- 保存项目；
- 保存当前最新版代码；
- 左侧 Project List 使用。

---

## messages

```sql
create table messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  role text not null,
  content text not null,
  created_at timestamptz default now()
);
```

role：

```text
user
assistant
system
```

用途：

保存对话历史。

---

## versions

```sql
create table versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  version_number integer not null,
  prompt text,
  code text not null,
  created_at timestamptz default now()
);
```

用途：

- 每次生成保存版本；
- 支持 Version History；
- 支持 Restore。

---

# 5. 生成 App 的运行方式

V1 不生成完整 React 项目。

不要做：

```text
LLM
 ↓
React Files
 ↓
npm install
 ↓
vite build
 ↓
sandbox runtime
```

风险太高。

V1 只让 Qwen 输出：

```text
完整 self-contained HTML
```

结构：

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    ...
  </style>
</head>

<body>
  ...

  <script>
    ...
  </script>
</body>
</html>
```

然后前端：

```tsx
<iframe
  sandbox="allow-scripts"
  srcDoc={generatedHtml}
/>
```

即可真实运行。

---

# 6. AI 生成 App 的范围

为了确保生成稳定，V1 明确限制为浏览器内可运行的小型网页应用。

适合：

- Todo
- Pomodoro Timer
- Calculator
- Quiz
- Flashcard
- Habit Tracker
- Expense Tracker
- Dashboard
- Notes
- Personal Landing Page
- Simple Game
- Form
- Kanban
- Countdown
- Unit Converter

不支持：

- 动态 npm 包安装
- Python 后端
- Node 后端
- 数据库自动创建
- 支付
- OAuth
- 复杂第三方 API
- 文件系统
- 真实多人协作

UI 中可以写：

> Best for small interactive web apps, tools and dashboards.

这不是缺点，而是合理控制问题空间。

---

# 7. Generated App 自身的数据持久化

这里有两层持久化。

## 第一层：Builder 数据

保存：

```text
Project
Messages
Versions
Generated Code
```

使用 Supabase。

---

## 第二层：AI 生成 App 的业务数据

例如 AI 生成 Todo：

```text
Buy milk
Finish report
```

是否刷新后保留？

V1 可以要求 Qwen：

> 对于需要本地数据保存的应用，优先使用 localStorage。

因此生成的 Todo / Habit Tracker 等，也可以在自己的 iframe 中使用浏览器 localStorage。

这是一个非常便宜但效果很好的亮点。

---

# 8. 页面布局

推荐一个简单的三栏工作区。

```text
┌───────────────────────────────────────────────────────────────┐
│ Mini Atoms                                          New App   │
├──────────────┬─────────────────────┬──────────────────────────┤
│              │                     │                          │
│ Projects     │ Agent / Chat        │ Preview                  │
│              │                     │                          │
│ Pomodoro     │ User:               │                          │
│ Expense      │ Build me...         │   Generated Application  │
│ Quiz         │                     │                          │
│              │ Agent:              │                          │
│              │ ✓ Understanding     │                          │
│              │ ✓ Building          │                          │
│              │                     │                          │
│              │ [prompt........] ↑  │                          │
│              │                     │                          │
├──────────────┴─────────────────────┴──────────────────────────┤
│                                                             │
└───────────────────────────────────────────────────────────────┘
```

移动端可以退化为 Tabs：

```text
Chat | Preview | Projects
```

---

# 9. Agent UI

V1 不真正实现多个 Agent。

后台只调用一次 Qwen。

但 UI 可以显示 Agent 工作阶段：

```text
Understanding request
Planning app
Building interface
Checking result
App ready
```

推荐状态：

```ts
type GenerationStatus =
  | "idle"
  | "understanding"
  | "planning"
  | "building"
  | "ready"
  | "error";
```

这些状态主要负责 UX，不意味着后台必须真的有五次模型调用。

---

# 10. API 设计

## POST /api/generate

用途：

首次生成 App。

Input：

```json
{
  "prompt": "Build a pomodoro timer with a task list"
}
```

Output：

```json
{
  "name": "Focus Timer",
  "summary": "A pomodoro timer with tasks",
  "html": "<!DOCTYPE html>..."
}
```

---

## POST /api/modify

用途：

根据当前 App 和新的用户需求生成下一版本。

Input：

```json
{
  "prompt": "Make it dark mode and add a circular progress ring",
  "currentHtml": "<!DOCTYPE html>..."
}
```

Output：

```json
{
  "summary": "Added dark mode and progress ring",
  "html": "<!DOCTYPE html>..."
}
```

如果想继续降低复杂度，也可以只保留：

```text
POST /api/generate
```

通过参数区分 create / modify。

---

# 11. LLM Prompt 设计

## System Prompt 核心规则

```text
You are an expert frontend engineer inside an AI app builder.

Your task is to create or modify a complete, self-contained web application.

REQUIREMENTS:

1. Return one complete HTML document.
2. Put all CSS inside <style>.
3. Put all JavaScript inside <script>.
4. Do not use external libraries.
5. Do not use external network requests.
6. Do not use npm packages.
7. The app must run directly inside an iframe using srcDoc.
8. All visible buttons and controls must work.
9. Make the design polished and responsive.
10. Use localStorage when the generated app needs lightweight data persistence.
11. Do not return Markdown code fences.
12. Do not explain the code.
13. Return only the final HTML.
```

---

## Modify Prompt

修改时加入：

```text
The user wants to modify an existing application.

USER REQUEST:
{newPrompt}

CURRENT HTML:
{currentHtml}

Preserve all existing functionality unless the user explicitly requests its removal.

Return the complete updated HTML document only.
```

---

# 12. V1 — 必须完成

V1 是提交作业的最低完整版本。

## V1 目标

实现真正可验收的核心产品：

```text
Create
→ Generate
→ Preview
→ Modify
→ Save
→ Reload
```

---

## V1.1 New Project

Landing 或 Workspace 中提供：

```text
What do you want to build?
```

输入：

```text
Build me a pomodoro timer with a task list
```

按钮：

```text
Build
```

---

## V1.2 AI Generate

点击后：

```text
POST /api/generate
```

调用 Qwen。

显示 Agent 状态：

```text
Understanding...
Planning...
Building...
```

成功后进入：

```text
App ready
```

---

## V1.3 Live Preview

右侧 iframe 加载生成 HTML。

生成 App 必须真实交互。

例如 Pomodoro：

```text
Start
Pause
Reset
Add Task
Delete Task
```

都必须真正工作。

---

## V1.4 Follow-up Modify

底部 Chat Input：

```text
Make it dark mode and add a progress ring.
```

调用：

```text
POST /api/modify
```

把：

```text
current HTML
+
new user prompt
```

交给 Qwen。

返回完整新 HTML。

Preview 更新。

---

## V1.5 Persistence

每次生成/修改后保存：

```text
project
current_code
messages
```

刷新页面后：

```text
Project List
```

仍能看到原项目。

点击项目：

```text
恢复聊天历史
恢复 Preview
```

---

## V1.6 Project List

左侧：

```text
Projects

Pomodoro Timer
Expense Tracker
Quiz App

+ New Project
```

至少支持：

```text
create
open
```

有时间再做：

```text
rename
delete
```

---

## V1.7 Error Handling

至少需要：

### LLM 调用失败

```text
Generation failed.

[Retry]
```

### Prompt 为空

```text
Describe what you want to build.
```

### Loading 状态

禁止重复点击 Build。

---

## V1.8 Online Deployment

部署：

```text
Vercel
```

最终提供：

```text
https://your-project.vercel.app
```

验收者：

- 不需要安装任何软件；
- 不需要输入 Qwen API Key；
- 不需要搭数据库；
- 打开链接即可使用。

---

# 13. V1 API Key 与成本保护

验收使用的是你的服务端 API Key。

不要要求评审 BYOK。

但需要防止 API 被刷。

## V1 最少做两层保护

### 输入长度

例如：

```text
2000 characters
```

---

### 简单 rate limit

例如：

```text
每 IP：
10 次 / 小时
```

或者 Demo 模式：

```text
每个浏览器最多 10–20 次生成
```

Server-side rate limit 更可靠。

---

## 环境变量

```env
DASHSCOPE_API_KEY=
QWEN_BASE_URL=
QWEN_MODEL=qwen3-coder-next

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

`SUPABASE_SERVICE_ROLE_KEY` 如果使用，必须只在 Server 端。

---

# 14. V1 验收 Demo Script

提交前必须自己完整走一遍。

## Demo Case 1

输入：

```text
Build a pomodoro timer with a task list.
```

检查：

- 成功生成；
- Start 工作；
- Reset 工作；
- Add task 工作；
- Delete task 工作。

然后输入：

```text
Make it dark mode and add a circular progress indicator.
```

检查：

- 修改成功；
- 原有功能仍然正常；
- Preview 更新。

刷新网页。

检查：

- Project 还在；
- Preview 还在；
- Chat 还在。

---

## Demo Case 2

输入：

```text
Build a simple expense tracker where I can add expenses,
choose categories, see the total and delete entries.
Persist the expenses locally.
```

检查：

- 添加支出；
- 删除；
- total 更新；
- 刷新生成 App 后数据仍存在。

---

# 15. V2 — Version History

V1 稳定后，优先实现 V2。

这是最值得做的延展能力。

## 功能

每次生成：

```text
Version 1
```

每次修改：

```text
Version 2
Version 3
...
```

UI：

```text
Version History

V3  Added progress ring
V2  Dark mode
V1  Initial generation
```

点击 V2：

```text
Preview V2
```

按钮：

```text
Restore this version
```

恢复后：

```text
current_code = V2.code
```

最好再生成一个新的 version，而不是删除历史。

---

## 为什么 V2 优先

开发成本较低：

```text
INSERT version
SELECT versions
UPDATE current_code
```

但展示效果非常好：

- 有产品感；
- 有 Agent 迭代感；
- 证明考虑了可恢复性；
- 体现工程设计。

---

# 16. V3 — Fix with AI

如果 V1 + V2 都已经稳定，再考虑。

## 用户体验

Preview 或 Agent Panel：

```text
Something went wrong.

[Fix with AI]
```

点击：

```text
current code
+
error information
```

发送给 Qwen。

Prompt：

```text
The generated application has an issue.

ERROR:
{error}

CURRENT HTML:
{html}

Fix the issue while preserving existing features.

Return the complete corrected HTML only.
```

生成：

```text
new version
```

---

## V3 的简化版

真正捕获 iframe runtime error 比较麻烦。

如果时间不足，可以做：

```text
Fix / Improve with AI
```

让用户点击后直接让 AI：

```text
review current code
find likely bugs
improve robustness
```

不必实现完整 console bridge。

---

# 17. V4 — Preview UX

如果还有时间，再做 UI 提升。

## Desktop / Mobile Toggle

```text
Desktop
Tablet
Mobile
```

本质只改变 iframe wrapper width。

例如：

```text
Desktop → 100%
Tablet  → 768px
Mobile  → 390px
```

这是很便宜但很像成熟产品的功能。

---

## Refresh Preview

```text
Refresh
```

通过更新 iframe key 重新挂载。

---

## Open Preview

可选。

不是 V1 必须。

---

# 18. V5 — Code View

如果时间仍然充足：

```text
Preview | Code
```

Code Tab 只做：

```text
read-only code viewer
```

不要一开始做 Monaco Editor。

如果真的有很多余时间，再允许编辑代码并：

```text
Apply
```

更新 Preview。

---

# 19. V6 — Auth

登录注册是最低优先级之一。

如果主流程已经完全稳定，可以接：

```text
Supabase Auth
```

支持：

```text
Email login
```

然后：

```text
projects.user_id
```

每个人只看自己的项目。

---

## 如果没时间做 Auth

完全可以使用：

```text
anonymous demo session
```

并在 README 中解释：

> Authentication was deliberately deprioritized to focus the 6–8 hour implementation window on the core agentic generation, iteration, preview, and persistence workflow.

这是合理的工程取舍。

---

# 20. 版本优先级总览

| Version | 功能 | 优先级 | 预计价值 |
|---|---|---:|---|
| V1 | Prompt → Generate | 必须 | 核心 |
| V1 | iframe Live Preview | 必须 | 核心 |
| V1 | Chat Modify | 必须 | 核心 |
| V1 | Persistence | 必须 | 核心 |
| V1 | Projects List | 必须 | 高 |
| V1 | Error / Loading | 必须 | 高 |
| V1 | Online Deploy | 必须 | 核心 |
| V2 | Version History | 很高 | 很高 |
| V2 | Restore | 很高 | 很高 |
| V3 | Fix with AI | 中高 | 高 |
| V4 | Device Preview | 中 | 中 |
| V5 | Code View | 低 | 中 |
| V6 | Login/Register | 低 | 中 |

---

# 21. 6–8 小时开发顺序

## 0:00–0:30

项目初始化：

```text
Next.js
TypeScript
Tailwind
Git
.env.local
```

完成基础三栏 UI。

---

## 0:30–1:30

只做一件事情：

```text
Prompt
↓
Qwen
↓
HTML
```

先在 console 里看到模型返回 HTML。

不要碰数据库。

---

## 1:30–2:15

加入：

```text
iframe srcDoc
```

目标：

> 第一次看到 Qwen 生成的 App 真正在页面里运行。

到这里已经拥有最重要的技术闭环。

---

## 2:15–3:00

实现：

```text
Follow-up Modify
```

目标：

```text
V1 HTML
+
"make it dark mode"
↓
Qwen
↓
V2 HTML
```

Preview 更新。

---

## 3:00–4:00

接 Supabase：

```text
projects
messages
```

实现：

```text
save
load
```

---

## 4:00–4:45

Project Sidebar：

```text
New
Open
```

刷新网页后重新加载项目。

---

## 4:45–5:30

V2 Version History：

```text
versions
restore
```

如果前面超时，这一步可以后移。

---

## 5:30–6:15

完善：

```text
loading
error
empty state
retry
disabled states
responsive UI
```

---

## 6:15–7:00

部署 Vercel：

```text
environment variables
production test
```

---

## 7:00–8:00

只做：

```text
完整验收
Bug fixes
README
Screenshots
Demo cases
```

不要在最后一小时新增大功能。

---

# 22. Stop Rules：什么时候必须停止加功能

如果出现以下任何情况：

### 到第 2 小时还不能生成并 Preview

停止全部 UI polish / database 工作。

只解决：

```text
Generate → Preview
```

---

### 到第 4 小时还不能 Modify

停止做：

```text
Version History
Auth
Code Editor
```

只解决修改闭环。

---

### 到第 6 小时还没 Deploy

停止加新功能。

立刻部署。

---

# 23. 推荐文件结构

```text
mini-atoms/
│
├── app/
│   ├── page.tsx
│   │
│   ├── workspace/
│   │   └── [projectId]/
│   │       └── page.tsx
│   │
│   └── api/
│       ├── generate/
│       │   └── route.ts
│       └── modify/
│           └── route.ts
│
├── components/
│   ├── ProjectSidebar.tsx
│   ├── AgentChat.tsx
│   ├── PromptInput.tsx
│   ├── AgentStatus.tsx
│   ├── AppPreview.tsx
│   └── VersionHistory.tsx
│
├── lib/
│   ├── qwen.ts
│   ├── supabase.ts
│   └── prompts.ts
│
├── types/
│   └── index.ts
│
├── .env.local
├── README.md
└── package.json
```

不要过度分层。

---

# 24. 核心数据流

## Create

```text
User Prompt
      │
      ▼
POST /api/generate
      │
      ▼
Qwen
      │
      ▼
HTML
      │
      ├──────────► iframe Preview
      │
      ▼
Supabase
      │
      ├── Project
      ├── Message
      └── Version 1
```

---

## Modify

```text
New Prompt
+
Current HTML
      │
      ▼
POST /api/modify
      │
      ▼
Qwen
      │
      ▼
Updated HTML
      │
      ├──────────► iframe Preview
      │
      ▼
Supabase
      │
      ├── Message
      ├── Project.current_code
      └── Version N
```

---

# 25. 安全与可靠性

## API Key

禁止：

```text
NEXT_PUBLIC_DASHSCOPE_API_KEY
```

禁止浏览器直接调用模型。

必须：

```text
Server Route
↓
Qwen
```

---

## iframe

建议：

```html
sandbox="allow-scripts"
```

默认不要给：

```text
allow-same-origin
```

除非确实需要并理解风险。

---

## Prompt Injection / Generated Code

Demo 范围内，system prompt 明确要求：

- 不发网络请求；
- 不加载外部脚本；
- 不访问父页面；
- 不请求浏览器敏感权限。

---

## Qwen Output Validation

服务端至少检查：

```text
output exists
contains <html or <!DOCTYPE html
reasonable length
```

如果模型返回 Markdown fence：

```text
```html
...
```
```

可以 server-side 清理。

---

# 26. 成本控制策略

不要做真正的：

```text
Planner call
Builder call
Reviewer call
```

一次生成调用 3 个模型。

V1 只使用：

```text
1 user action
=
1 Qwen API call
```

UI 可以表现：

```text
Understanding
Planning
Building
```

但不需要真的三个 LLM。

---

## 修改时上下文

不要发送整个历史对话。

V1 可以只发送：

```text
System Prompt
Current HTML
Latest User Request
```

如果确实需要语义历史，再发送最近 2–4 条 message。

这样可以显著降低 token。

---

# 27. 验收者体验

评审流程应该是：

```text
打开 URL
↓
输入 app idea
↓
Build
↓
看到 Agent 状态
↓
看到可运行 App
↓
点击 App 内按钮
↓
输入修改要求
↓
看到 App 更新
↓
刷新浏览器
↓
项目仍然存在
↓
打开历史项目
↓
继续修改
```

评审不应该：

- 输入 API Key；
- 安装依赖；
- 下载代码才能体验；
- 自己启动数据库；
- 阅读 README 才知道怎么用。

---

# 28. README 最终应该体现的工程取舍

提交时主动解释：

## 为什么只生成 HTML/CSS/JS？

因为挑战只有 6–8 小时。

选择 self-contained HTML：

- 避免动态 npm 依赖；
- 避免 build sandbox；
- 提高生成成功率；
- 降低 runtime failure；
- 保证即时 Preview；
- 保持未来扩展到 React/Sandpack/WebContainer 的可能。

这是 **主动控制复杂度**，不是能力不足。

---

## 为什么不是多个真实 Agent？

真正多 Agent 会：

- 增加 token；
- 增加 latency；
- 增加失败点；
- 对 V1 用户价值有限。

所以 V1 使用单次 LLM generation pipeline，同时通过 Agent Status 暴露清晰的执行阶段。

未来可以扩展成：

```text
Planner
Designer
Coder
Reviewer
```

---

# 29. V1 Definition of Done

以下全部满足，V1 才算完成。

- [ ] 有在线访问 URL
- [ ] 验收者无需 API Key
- [ ] 用户可以输入应用需求
- [ ] 请求真实调用 Qwen
- [ ] Qwen 返回真实网页代码
- [ ] Preview 能真实运行
- [ ] Preview 内至少包含真实交互
- [ ] 用户可以继续自然语言修改
- [ ] 修改后 Preview 更新
- [ ] 项目会持久化
- [ ] 刷新网页项目仍存在
- [ ] 可以重新打开旧项目
- [ ] 有 loading 状态
- [ ] 有错误状态
- [ ] API Key 不暴露在前端
- [ ] Production 环境实际测试通过

---

# 30. V2 Definition of Done

- [ ] 每次生成创建 Version
- [ ] 每次修改创建 Version
- [ ] Version List 正确展示
- [ ] 可以预览旧版本
- [ ] 可以 Restore
- [ ] Restore 不破坏原有历史

---

# 31. 最后的优先级

如果只记住一句话：

> **先把一个小闭环做到真的能用，再加亮点，不要把时间耗在“看起来很高级但不影响验收”的基础设施上。**

最终目标不是：

```text
最复杂的 Atoms clone
```

而是：

```text
6–8 小时内完成度最高的 Mini Atoms
```

最值得提交的版本是：

```text
Prompt
↓
Qwen
↓
Generate
↓
Interactive Preview
↓
Chat Modify
↓
Supabase Save
↓
Version History
↓
Vercel Deploy
```

这套方案已经能够同时覆盖：

- 完成度
- 工程思维
- 用户体验
- 创新性
- 可交付性
