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

### macOS 一键启动（DeepSeek 官方 API）

如果使用 DeepSeek 官方 API，建议先将 API Key 保存到 macOS 钥匙串。该操作只需执行一次：

```bash
security add-generic-password \
  -a "$USER" \
  -s contextpilot-deepseek \
  -w
```

终端提示 `password data for new item:` 时粘贴 API Key；输入过程不会显示字符。可用以下命令确认凭证已经保存，但不会打印密钥：

```bash
security find-generic-password \
  -a "$USER" \
  -s contextpilot-deepseek >/dev/null \
  && echo "API Key 已保存"
```

随后在 `~/.config/opencode/opencode.json` 的顶层配置 DeepSeek provider；如果文件中已有 `mcp` 等字段，请保留并合并，不要整体覆盖：

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
        "deepseek-v4-flash": {
          "name": "DeepSeek V4 Flash"
        },
        "deepseek-v4-pro": {
          "name": "DeepSeek V4 Pro"
        }
      }
    }
  }
}
```

完成依赖安装、OpenCode 配置和 `.env.local` 配置后，在项目根目录执行：

```bash
npm run dev:local
```

该命令会从 macOS 钥匙串读取 `contextpilot-deepseek`，并同时启动：

- OpenCode：`http://127.0.0.1:4096`
- ContextPilot：`http://127.0.0.1:5173`

终端窗口需要保持运行。按 `Control + C` 会同时停止前端和由该命令启动的 OpenCode 服务。API Key 不会写入项目文件。

### 选择并安装修改版 OpenCode

ContextPilot 的上下文忽略功能依赖修改版 OpenCode。官方 OpenCode 不包含
`contextpilot.context-part-ids` 筛选逻辑，因此不能直接替代下面三个实验版本。

请从项目的
[GitHub Releases](https://github.com/Yinjony/contextpilot/releases)
下载与电脑匹配的一个 ZIP：

| 编号 | 电脑类型 | 判断方法 | 需要下载的文件 |
| --- | --- | --- | --- |
| 1 | Apple Silicon Mac（M1、M2、M3、M4 等） | `uname -m` 输出 `arm64` | `opencode-darwin-arm64.zip` |
| 2 | Intel Mac | `uname -m` 输出 `x86_64` | `opencode-darwin-x64.zip` |
| 3 | Windows x64 | “设置 → 系统 → 系统信息”显示 64 位、x64 | `opencode-windows-x64.zip` |

三个 ZIP 都必须先完整解压，不能直接在压缩包预览窗口中运行安装脚本。安装程序
只替换 OpenCode 可执行文件，不修改 ContextPilot 源码、会话、模型配置或 API Key。

#### 1. Apple Silicon Mac 安装

只适用于 `uname -m` 输出 `arm64` 的 Mac。

1. 下载 `opencode-darwin-arm64.zip`。
2. 双击 ZIP，将下面两个文件完整解压到同一个文件夹：

```text
opencode
install-macos.command
```

3. 双击 `install-macos.command`。
4. 如果 macOS 阻止脚本运行，按住 Control 点击该文件，选择“打开”，再确认“打开”。
5. 脚本显示“安装成功”后按回车关闭窗口。

安装成功时应显示：

```text
版本：1.17.9
架构：arm64
```

#### 2. Intel Mac 安装

只适用于 `uname -m` 输出 `x86_64` 的 Mac。

1. 下载 `opencode-darwin-x64.zip`。
2. 双击 ZIP，将下面两个文件完整解压到同一个文件夹：

```text
opencode
install-macos.command
```

3. 双击 `install-macos.command`。
4. 如果 macOS 阻止脚本运行，按住 Control 点击该文件，选择“打开”，再确认“打开”。
5. 脚本显示“安装成功”后按回车关闭窗口。

安装成功时应显示：

```text
版本：1.17.9
架构：x86_64
```

安装脚本会自动检查系统与文件架构、验证版本和 ContextPilot 筛选标记，并将原
文件备份为：

```text
~/.opencode/bin/opencode.backup-日期时间
```

随后才会安装到：

```text
~/.opencode/bin/opencode
```

脚本不会修改 ContextPilot 源码、会话数据、模型配置或 API Key。

如果无法双击脚本，可在解压目录中打开终端，执行：

```bash
chmod +x install-macos.command
./install-macos.command
```

#### 3. Windows x64 安装

1. 下载 `opencode-windows-x64.zip`。
2. 右键 ZIP，选择“全部解压”，确认下面三个文件位于同一个文件夹：

```text
opencode.exe
install-windows.cmd
install-windows.ps1
```

3. 双击 `install-windows.cmd`。若 Windows SmartScreen 提示风险，先确认文件来自
   本项目 Release，再选择“更多信息 → 仍要运行”。
4. 脚本会检查 Windows x64 架构、版本号与 ContextPilot 筛选标记，然后备份原
   文件并完成替换。
5. 看到“安装成功”和 `版本：1.17.9` 后，按任意键关闭窗口。

原文件会备份为：

```text
%USERPROFILE%\.opencode\bin\opencode.exe.backup-日期时间
```

修改版会安装到：

```text
%USERPROFILE%\.opencode\bin\opencode.exe
```

如果双击安装失败，可在解压目录中打开 PowerShell，执行：

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\install-windows.ps1"
```

若提示文件正在使用，请先关闭 ContextPilot 和所有正在运行的 OpenCode
终端窗口，再重新执行安装脚本。

### 校验下载文件（可选但推荐）

Release 同时提供 `checksums.txt`。下载后可核对 ZIP 是否完整：

macOS：

```bash
shasum -a 256 opencode-darwin-arm64.zip
# Intel Mac 将文件名替换为 opencode-darwin-x64.zip
```

Windows PowerShell：

```powershell
Get-FileHash .\opencode-windows-x64.zip -Algorithm SHA256
```

输出值应与 `checksums.txt` 中对应文件一致。

### 启动修改版 OpenCode 服务

安装后必须使用上面替换好的文件启动服务。ContextPilot 连接的是
`http://127.0.0.1:4096`；如果该端口运行的是官方 OpenCode，上下文忽略功能
不会生效。

Apple Silicon Mac 和 Intel Mac 使用同一条启动命令：

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

看到服务监听在 `http://127.0.0.1:4096` 后，保持该终端窗口运行，再打开另一
个终端启动 ContextPilot 前端。若提示 4096 端口已被占用，请先关闭原来运行的
OpenCode 服务，避免 ContextPilot 继续连接官方版本。

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

### 分别启动服务

如果不使用 macOS 一键启动命令，需要先按上一节启动 OpenCode，并保持该终端窗口运行；然后打开另一个终端启动前端：

```bash
npm run dev -- --host 127.0.0.1 --port 5173
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

默认使用响应更快的 `deepseek-v4-flash`；需要更强推理时可改为 `deepseek-v4-pro`。

请勿将密码、API Key 或其他敏感配置提交到 Git 仓库。

## 可用命令

```bash
# macOS：从钥匙串读取 DeepSeek API Key，同时启动 OpenCode 和前端
npm run dev:local

# 仅启动前端（OpenCode 需要单独启动）
npm run dev

# 构建生产版本
npm run build

# 本地预览生产构建
npm run preview
```

## License

当前仓库尚未声明开源许可证。在添加正式许可证之前，请勿默认将项目用于分发或商业用途。
