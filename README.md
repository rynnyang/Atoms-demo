# Mini Atoms — AI 应用构建器

**在线地址：** https://atoms-demo-pied.vercel.app

Mini Atoms 可以把一个产品想法转成可运行的小型网页应用。项目支持两种模式：

- **Qwen LLM Agent：** 配置服务端 Qwen API Key 后，使用大模型根据开放式自然语言需求生成和修改完整的 HTML/CSS/JavaScript。
- **本地 Agent 回退：** 未配置 Key 时，仍可以通过交互模板和本地规则完成免费、零配置的演示。

## 已实现功能

### 核心构建流程（V1）

- 通过自然语言创建应用：配置 Qwen 后使用 LLM；没有 Key 时使用本地 Agent 回退。
- 在沙箱 iframe 中实时预览生成的独立 HTML 应用。
- 内置可交互应用模板：番茄钟、待办清单、记账、计算器、倒计时、落地页和笔记。
- 通过聊天继续修改应用：Qwen 模式支持开放式修改；本地模式支持主题、颜色、标题、进度环和持久化计数器。
- Agent 工作状态展示：理解需求、规划应用、构建界面、完成。
- 项目列表：新建、打开和删除项目。
- 浏览器本地持久化：项目、消息、生成代码和版本历史在刷新后仍会保留。
- 加载状态、请求失败重试、空输入校验、2000 字符输入上限和简单的每 IP 限流。

### 版本历史（V2）

- 每次生成和修改都会创建一个版本。
- 可以预览任意历史版本。
- 可以恢复到旧版本，同时保留已有历史记录。

### 预览体验（V3）

- Desktop、Tablet、Mobile 三种预览宽度。
- Refresh 可重新挂载 iframe 并重启应用。
- 显示当前预览设备和宽度。

### 代码查看与审查（V5）

- 只读查看生成的 HTML 代码。
- 一键复制代码或下载为独立 `.html` 文件。
- 本地静态代码审查：检查完整 HTML 文档、内联样式、交互事件、外部依赖和 localStorage 使用情况。
- 静态审查不能替代实际运行测试，请仍在 Preview 中操作应用验证功能。

## 如何使用网站

1. 打开 https://atoms-demo-pied.vercel.app。
2. 在中间聊天区域输入需求，例如：

   ```text
   Build a pomodoro timer with a task list.
   ```

3. 点击 **Build**，右侧会显示可立即操作的应用预览。
4. 继续输入修改需求，例如：

   ```text
   Make it dark mode and add a circular progress ring.
   ```

5. 点击顶部 **Version History**，可以预览历史结果或恢复指定版本。
6. 使用右侧的 **Desktop / Tablet / Mobile** 查看响应式效果，使用 **Refresh** 重启预览应用。
7. 点击 **Code** 可查看、复制或下载 HTML；点击 **Review** 可查看本地静态审查结果。
8. 刷新浏览器，再从左侧项目列表打开项目，可验证项目、聊天、代码和版本历史均已保存。

## 启用 Qwen LLM

当前线上站点未配置 Key 时会使用本地 Agent。Qwen Key 只由 Next.js 服务端读取，不会传到浏览器。

### 本地开发填写位置

先复制环境变量模板：

```powershell
Copy-Item .env.local.example .env.local
```

然后打开 **`.env.local`**，在下面这一行等号后填写你的真实 Key：

```env
# 在等号后粘贴你的 Qwen / DashScope API Key：
DASHSCOPE_API_KEY=
```

可选设置：

```env
# 请使用你的 Model Studio / QwenCloud 账号和区域对应的 OpenAI 兼容地址。
QWEN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1

# 填写你账号已开通的模型名称。
QWEN_MODEL=qwen3.7-flash
```

运行本地项目：

```powershell
npm ci
npm run dev
```

填写 `DASHSCOPE_API_KEY` 后，下一次点击 Build 或 Update，页面顶部会显示 **Qwen LLM Agent**。保持为空则继续使用免费的本地 Agent 回退。

### Vercel 线上填写位置

1. 打开 Vercel 项目。
2. 进入 **Settings → Environment Variables**。
3. 新增变量 `DASHSCOPE_API_KEY`，值填写你的真实 Key。
4. 勾选 **Production**；如希望预览部署也调用 Qwen，可同时勾选 **Preview**。
5. 如需要，可再添加 `QWEN_BASE_URL` 和 `QWEN_MODEL`。
6. 到 **Deployments** 页面重新部署最新的 `main` 提交。

不要使用 `NEXT_PUBLIC_DASHSCOPE_API_KEY`，也不要提交 `.env.local` 文件。

Qwen 支持 OpenAI 兼容的 Chat Completions 接口。请从你的 Qwen / Model Studio 控制台获取 API Key，并使用对应账号和区域的 Base URL。参考 [Qwen 官方接入文档](https://www.alibabacloud.com/help/en/model-studio/first-api-call-to-qwen)。

## 两种模式的工作方式

```text
用户输入需求
  -> POST /api/generate 或 /api/modify
  -> 是否配置 DASHSCOPE_API_KEY？
       是：调用 Qwen，校验后返回完整 HTML
       否：调用本地 Agent，返回模板或执行支持的 HTML 变换
  -> iframe 实时预览
  -> localStorage 保存项目、消息和版本
```

服务端会校验模型输出；生成失败时界面会展示错误信息并提供 Retry。

## 实现思路与关键取舍

本项目把“从自然语言到可运行应用”的最短闭环拆为五步：收集需求、生成或修改单页应用、在 iframe 中预览、对话式迭代、保存项目与版本。这样可以在有限时间内先验证核心体验，而不是先搭建一个复杂但不可用的平台。

| 目标 | 当前方案 | 取舍原因 |
| --- | --- | --- |
| 自然语言生成 | 服务端调用 Qwen，要求返回完整、独立的 HTML/CSS/JavaScript | 无需额外的代码执行服务，生成结果可以直接预览、复制与下载；代价是复杂多文件项目的可维护性有限。 |
| 无 Key 可运行 | 本地 Agent 模板 + 规则变换 | 让评审和使用者零配置即可体验完整流程，也控制了开发与 API 成本；代价是本地模式只覆盖有限的意图，不能替代开放式 LLM 生成。 |
| 预览 | 浏览器 iframe 的 `srcDoc` | 实现快、隔离页面样式、支持生成应用自行使用 localStorage；它不是运行不可信代码的严格安全沙箱。 |
| 持久化 | 浏览器 localStorage | 无需注册和后端即可满足 Demo 的刷新后可恢复；代价是数据只属于当前浏览器，无法跨设备同步或协作。 |
| 版本管理 | 每次成功生成/修改保存完整 HTML 快照 | 便于预览和一键恢复，逻辑可靠；代价是大页面会重复存储，尚未实现差异化存储。 |
| 代码审查 | 浏览器端静态规则检查 | 可快速给出结构、交互、依赖和 localStorage 的风险提示；它不运行测试，也不等同于安全审计。 |

### 生成链路

```text
用户需求
  -> 前端立即显示发送中的消息
  -> /api/generate 或 /api/modify
  -> Qwen（已配置 Key）或本地 Agent（回退）
  -> 校验完整 HTML 文档
  -> 保存项目、消息和版本快照至 localStorage
  -> iframe 预览，可继续通过对话修改
```

API Key 仅用于服务端 API Route；前端不会收到 Key。模型调用出错时，用户的需求会保留在对话中，并可在修正配置后点击 Retry 重试。

## 当前完成程度

### 已完成

- 完成了从自然语言输入、生成、预览、继续修改到版本恢复的核心闭环。
- 支持可选 Qwen LLM 和无需 API 成本的本地 Agent 回退，两种模式均可完成 Demo 演示。
- 完成项目、对话、代码和版本历史的浏览器本地持久化。
- 完成响应式预览、刷新、代码查看/复制/下载，以及基础静态代码审查。
- 完成请求错误提示、输入保留与重试、空输入限制和适合 Demo 的内存限流。
- 已使用 Next.js 生产构建验证，项目可部署至 Vercel。

### 尚未完成 / 有意保留为后续工作

- 没有账号体系、云端数据库、跨设备同步或多人协作；当前数据仅保存于当前浏览器。
- 生成结果是一个独立 HTML 文件，不支持真正的多文件项目、依赖安装、包管理、文件树或运行日志。
- Qwen 调用目前为一次性请求，没有流式输出、取消生成、用量配额面板或自动多轮修复。
- 本地 Agent 是可预测的 Demo 回退，不具备任意自然语言生成代码的能力。
- Code Review 是规则扫描，不包含单元测试、浏览器自动化测试、依赖漏洞扫描或人工级安全审计。
- iframe 的权限是为了支持交互和 localStorage 而放宽的，不能用于承载不可信第三方代码。
- 内存限流不适用于多实例生产部署，生成应用也还不能一键发布为独立站点。

## 如果继续投入时间

优先级按“先保证核心生成可靠，再补齐真实产品的协作和交付能力”排序：

### P0：生成可靠性与可观测性

1. 为 Qwen 返回结果增加结构化输出、HTML 解析校验和失败后的自动修复重试。
2. 加入流式生成状态、取消按钮、错误分类和请求 ID，降低用户等待时的不确定性。
3. 添加关键流程的端到端测试：生成、修改、版本恢复、刷新后恢复与错误重试。
4. 将内存限流替换为共享存储限流，并增加模型调用的预算与频率保护。

### P1：从单机 Demo 到可用产品

1. 接入身份认证和数据库，保存项目、版本、提示词与生成元数据，实现跨设备访问。
2. 支持文件树和多文件生成（如 React/Next.js 项目），提供差异视图、编辑器和运行日志。
3. 强化预览隔离策略，并加入生成代码的依赖白名单、网络访问控制和安全检查。
4. 支持将满意的生成结果一键发布为独立链接。

### P2：提高创作效率和差异化体验

1. 提供模板库、需求澄清问题和可复用的组件/设计系统。
2. 加入可视化修改：选中预览元素后用自然语言局部编辑，并展示修改前后的差异。
3. 支持协作、评论、分享、恢复点命名和生成过程回放。

## 部署

项目使用 Next.js 14。将 GitHub 仓库导入 Vercel 时，选择默认 **Next.js** 预设，根目录保持为 `./`。

- 只使用本地 Agent：无需配置任何环境变量。
- 需要真实 Qwen 生成：按上文在 Vercel 中配置 Qwen 环境变量。

连接后的 Vercel 项目会在每次推送 `main` 时自动创建生产部署。

## 安全和限制

- API Key 只保存在服务端环境变量中，不会写入生成的 HTML 或浏览器端 JavaScript。
- 预览 iframe 使用 `allow-scripts allow-same-origin`，以便生成应用使用 localStorage 保存自身数据；因此不要把它视为执行不可信第三方代码的安全隔离环境。
- 当前限流器是适合 Demo 的内存实现；真实多实例生产环境应替换为 Upstash、Redis 等共享存储。
- 每次 Qwen 的 Build / Update 都会发起一次模型请求；Update 会携带当前 HTML，因此通常比首次生成消耗更多 token。
