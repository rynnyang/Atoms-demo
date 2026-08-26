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

### 预览体验（V4）

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
QWEN_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1

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
