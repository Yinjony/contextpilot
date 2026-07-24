# ContextPilot

> 将隐式的对话记忆转化为可查看、可选择、可控制的上下文。

ContextPilot 是一个面向 AI 长对话与 Agent 协作场景的上下文管理原型系统。

系统通过独立的监督流程分析对话内容，将问题、结论、修复方案、关键报错和历史假设整理为结构化上下文卡片。用户可以查看和选择这些卡片，并决定哪些信息需要注入下一轮对话。

## 本地运行

### 环境要求

建议准备以下环境：

- Node.js 20 或更高版本
- npm
- OpenCode CLI
- 一个已在 OpenCode 中配置的可用模型

### 安装依赖

```bash
npm install
```
### 替换opencode.exe

将本项目下的`/exe/opencode.exe`
替换到 `C:\Users\用户名\.opencode\bin`下

### 启动 OpenCode 服务

默认情况下，ContextPilot 会连接以下地址：

```text
http://127.0.0.1:4096
```

启动 OpenCode Headless Server：

```bash
opencode serve --port 4096
```

如果 `opencode` 命令尚未加入系统环境变量，需要先配置其可执行文件路径。

### 配置项目目录

项目当前代码中包含一个 Windows 开发目录作为默认值。其他环境应通过环境变量显式设置 OpenCode 可以访问的项目绝对路径：

```env
VITE_OPENCODE_DIRECTORY=/absolute/path/to/contextpilot
```

macOS 或 Linux 示例：

```env
VITE_OPENCODE_DIRECTORY=/Users/your-name/Documents/contextpilot
```

Windows 示例：

```env
VITE_OPENCODE_DIRECTORY=C:\Users\your-name\Projects\contextpilot
```

该路径必须是运行 OpenCode Server 的机器能够访问和识别的目录。

### 启动前端

```bash
npm run dev
```

启动完成后访问：

```text
http://127.0.0.1:5173
```

## 环境变量

可以在项目根目录创建 `.env.local`：

```env
# 模型后端
VITE_CHAT_BACKEND=opencode

# OpenCode 服务
VITE_OPENCODE_BASE_URL=http://127.0.0.1:4096
VITE_OPENCODE_USERNAME=opencode
VITE_OPENCODE_PASSWORD=
VITE_OPENCODE_DIRECTORY=/absolute/path/to/contextpilot

# 模型配置
VITE_OPENCODE_PROVIDER_ID=opencode
VITE_OPENCODE_MODEL_ID=deepseek-v4-flash-free
VITE_OPENCODE_AGENT=
VITE_OPENCODE_MODEL_VARIANT=

# 流式输出
VITE_OPENCODE_STREAMING=true

# 是否允许主对话调用工具
VITE_OPENCODE_CHAT_ENABLE_TOOLS=false
```

请勿将密码、API Key 或其他敏感配置提交到 Git 仓库。 。

## 可用命令

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 本地预览生产构建
npm run preview
```

## License

当前仓库尚未声明开源许可证。在添加正式许可证之前，请勿默认将项目用于分发或商业用途。
