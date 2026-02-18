# AI Chatbot Project

这是一个使用 [Next.js](https://nextjs.org/) (App Router)、[Tailwind CSS](https://tailwindcss.com/) 和 OpenAI Edge Runtime 构建的 AI 聊天机器人。界面采用赛博朋克极光风格。

## 特性

-   🤖 **AI 对话**: 基于 OpenAI GPT 模型（也就是俗称的 "ChatGPT"）。
-   💬 **实时流式传输**: 结合 Edge Runtime 实现超低延迟的打字机效果。
-   🎨 **赛博朋克界面**: 霓虹光效、玻璃拟态、动态背景。
-   ⚡ **技术栈**: Next.js 14, Tailwind CSS 3, OpenAI SDK.
-   🔒 **安全**: 专为 Vercel 部署优化，环境变量零泄露风险。

## 部署到 Vercel (推荐)

本项目已完全配置好，支持一键部署到 Vercel。

1.  **Fork 本仓库** 到你的 GitHub。
2.  登录 [Vercel](https://vercel.com/) 并点击 **"Add New Project"**。
3.  导入你的 GitHub仓库。
4.  在部署页面的 **"Environment Variables"** (环境变量) 区域，添加：
    -   Key: `OPENAI_API_KEY`
    -   Value: `你的sk-开头OpenAI密钥`
5.  点击 **Deploy**。

🎉 部署完成后，Vercel 会给你一个免费的 `https://xxx.vercel.app` 域名，无需任何服务器运维。

## 本地开发

### 1. 克隆项目 & 安装依赖

```bash
git clone https://github.com/你的用户名/ai-chatbot.git
cd ai-chatbot
npm install
```

### 2. 配置环境变量

复制示例文件创建本地配置：

```bash
cp .env.example .env.local
```

编辑 `.env.local` 文件，填入你的 Key：

```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxx
```

> **注意**: `.env.local` 已被 `.gitignore` 忽略，不会提交到 GitHub，确保 Key 安全。

### 3. 运行开发服务器

启动项目：

```bash
npm run dev
```

打开浏览器访问 [http://localhost:3000](http://localhost:3000)。

## 注意事项

-   **API Base URL**: 如果你想使用自定义代理或第三方服务商，可以在 `OPENAI_BASE_URL` 环境变量中设置（无需修改代码）。
    -   在 Vercel 环境变量中添加 `OPENAI_BASE_URL` = `https://your-proxy.com/v1` 即可。

Enjoy coding!
