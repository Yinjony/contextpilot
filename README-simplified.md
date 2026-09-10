# ContextPilot

> 将隐式的对话记忆转化为可查看、可选择、可控制的上下文。

ContextPilot 是一个面向 AI 长对话与 Agent 协作场景的上下文管理原型系统。系统通过独立的监督流程分析对话内容，将问题、结论、修复方案、关键报错和历史假设整理为结构化上下文卡片。用户可以查看和选择这些卡片，并决定哪些信息需要注入下一轮对话。

## 本地运行

### 环境要求

- Node.js 20 或更高版本
- npm
- OpenCode CLI（需使用下文的修改版）
- 一个已在 OpenCode 中配置的可用模型

```bash
npm install
```

### macOS 一键启动（DeepSeek 官方 API）

1. 将 API Key 保存到钥匙串（只需执行一次，终端提示 `password data for new item:` 时粘贴，输入不回显）：

```bash
security add-generic-password -a "$USER" -s contextpilot-deepseek -w
```

2. 在 `~/.config/opencode/opencode.json` 顶层配置 DeepSeek provider。文件中已有 `mcp` 等字段时请保留并合并，不要整体覆盖：

```json
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "deepseek": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "DeepSeek Official API",
      "options": {
        "baseURL": "https://api.deepseek.com",
        "apiKey": "{env:DEEPSEEK_API_KEY}"
      },
      "models": {
        "deepseek-v4-flash": { "name": "DeepSeek V4 Flash" },
        "deepseek-v4-pro": { "name": "DeepSeek V4 Pro" }
      }
    }
  }
}
```

3. 配置好 `.env.local`（见[环境变量](#环境变量)）后执行：

```bash
npm run dev:local
```

该命令从钥匙串读取 `contextpilot-deepseek`，同时启动 OpenCode（`http://127.0.0.1:4096`）和前端（`http://127.0.0.1:5173`）。终端窗口需保持运行，`Control + C` 会同时停止两者。API Key 不会写入项目文件。

### 安装修改版 OpenCode

上下文忽略功能依赖修改版 OpenCode——官方版本不含 `contextpilot.context-part-ids` 筛选逻辑，不能替代。请从 [GitHub Releases](https://github.com/Yinjony/contextpilot/releases) 下载与电脑匹配的 ZIP，并**完整解压**后再运行安装脚本（不要在压缩包预览窗口中直接运行）：

| 电脑类型 | 判断方法 | 下载文件 |
| --- | --- | --- |
| Apple Silicon Mac（M1、M2、M3、M4 等） | `uname -m` 输出 `arm64` | `opencode-darwin-arm64.zip` |
| Intel Mac | `uname -m` 输出 `x86_64` | `opencode-darwin-x64.zip` |
| Windows x64 | 系统信息显示 64 位、x64 | `opencode-windows-x64.zip` |

**macOS**（两种架构步骤相同）：解压得到 `opencode` 与 `install-macos.command`，双击后者运行；若被 macOS 阻止，按住 Control 点击文件选择“打开”。无法双击时可在解压目录执行：

```bash
chmod +x install-macos.command
./install-macos.command
```

**Windows**：解压得到 `opencode.exe`、`install-windows.cmd`、`install-windows.ps1`，双击 `install-windows.cmd`；SmartScreen 提示风险时确认文件来自本项目 Release，选择“更多信息 → 仍要运行”。无法双击时可在解压目录用 PowerShell 执行：

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\install-windows.ps1"
```

安装脚本会自动校验系统架构、版本号（`1.17.9`）与 ContextPilot 筛选标记，先将原文件备份为 `opencode.backup-日期时间`（macOS 位于 `~/.opencode/bin/`，Windows 位于 `%USERPROFILE%\.opencode\bin\`），再完成替换。安装程序只替换 OpenCode 可执行文件，**不会修改 ContextPilot 源码、会话数据、模型配置或 API Key**。若提示文件正在使用，先关闭 ContextPilot 和所有 OpenCode 终端窗口后重试。

可选：Release 提供 `checksums.txt`，可用 `shasum -a 256 <file>`（macOS）或 `Get-FileHash <file> -Algorithm SHA256`（Windows PowerShell）核对下载完整性。

### 启动修改版 OpenCode 服务

ContextPilot 连接 `http://127.0.0.1:4096`，该端口必须运行**修改版** OpenCode，否则上下文忽略功能不会生效。若端口被官方版本占用，先关闭它再启动。

macOS（两种架构同一条命令）：

```bash
export DEEPSEEK_API_KEY="$(security find-generic-password -a "$USER" -s contextpilot-deepseek -w)"

~/.opencode/bin/opencode serve \
  --port 4096 \
  --hostname 127.0.0.1 \
  --cors http://127.0.0.1:5173 \
  --cors http://localhost:5173
```

Windows PowerShell：

```powershell
& "$HOME\.opencode\bin\opencode.exe" serve --port 4096 --hostname 127.0.0.1
```

看到服务监听在 `http://127.0.0.1:4096` 后保持终端运行，再另开一个终端启动前端：

```bash
npm run dev -- --host 127.0.0.1 --port 5173
```

访问 `http://127.0.0.1:5173`。

### 配置项目目录

项目当前代码中包含一个 Windows 开发目录作为默认值，其他环境应通过环境变量显式设置 OpenCode 可以访问的项目绝对路径（必须是运行 OpenCode Server 的机器能识别的目录）：

```env
# macOS / Linux 示例
VITE_OPENCODE_DIRECTORY=/Users/your-name/Documents/contextpilot

# Windows 示例
VITE_OPENCODE_DIRECTORY=C:\Users\your-name\Projects\contextpilot
```

## 环境变量

在项目根目录创建 `.env.local`：

```env
# 模型后端
VITE_CHAT_BACKEND=opencode

# OpenCode 服务
VITE_OPENCODE_BASE_URL=http://127.0.0.1:4096
VITE_OPENCODE_USERNAME=opencode
VITE_OPENCODE_PASSWORD=
VITE_OPENCODE_DIRECTORY=/absolute/path/to/contextpilot

# 模型配置（DeepSeek 官方 API）
VITE_OPENCODE_PROVIDER_ID=deepseek
VITE_OPENCODE_MODEL_ID=deepseek-v4-flash
VITE_OPENCODE_AGENT=contextpilot-chat
VITE_OPENCODE_MODEL_VARIANT=

# 流式输出
VITE_OPENCODE_STREAMING=true

# 是否允许主对话调用工具，以及超时/失败重试上限
VITE_OPENCODE_CHAT_ENABLE_TOOLS=true
VITE_OPENCODE_CHAT_TIMEOUT_MS=75000
VITE_OPENCODE_CHAT_MAX_RETRIES=2
```

默认使用响应更快的 `deepseek-v4-flash`；需要更强推理时可改为 `deepseek-v4-pro`。请勿将密码、API Key 或其他敏感配置提交到 Git 仓库。

## 可用命令

```bash
npm run dev:local  # macOS：从钥匙串读取 API Key，同时启动 OpenCode 和前端
npm run dev        # 仅启动前端（OpenCode 需要单独启动）
npm run build      # 构建生产版本
npm run preview    # 本地预览生产构建
```

## License

当前仓库尚未声明开源许可证。在添加正式许可证之前，请勿默认将项目用于分发或商业用途。
