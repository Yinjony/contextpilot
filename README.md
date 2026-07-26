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

### 选择并安装修改版 OpenCode

ContextPilot 的上下文忽略功能依赖修改版 OpenCode。官方 OpenCode 不包含
`contextpilot.context-part-ids` 筛选逻辑，因此不能直接替代下面三个实验版本。

先根据电脑类型选择且只下载一个文件：

| 编号 | 电脑类型 | 判断方法 | 需要下载的文件 |
| --- | --- | --- | --- |
| 1 | Apple Silicon Mac（M1、M2、M3、M4 等） | `uname -m` 输出 `arm64` | `opencode-darwin-arm64.zip` |
| 2 | Intel Mac | `uname -m` 输出 `x86_64` | `opencode-darwin-x64.zip` |
| 3 | Windows x64 | “设置 → 系统 → 系统信息”显示 64 位、x64 | `opencode.exe` |

> ZIP 不能直接运行。Mac 用户必须先解压并把其中的 `opencode` 安装到指定位置。
> Windows 用户也必须用下载的 `opencode.exe` 替换原文件。

#### 1. Apple Silicon Mac 安装

只适用于 `uname -m` 输出 `arm64` 的 Mac。

1. 下载 `opencode-darwin-arm64.zip`。
2. 双击 ZIP，将两个文件完整解压到同一个文件夹：

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
2. 双击 ZIP，将两个文件完整解压到同一个文件夹：

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

下载研究人员提供的修改版 `opencode.exe`。如果下载的是 ZIP，先解压得到
`opencode.exe`。

打开 PowerShell 并执行：

```powershell
# 创建安装目录
New-Item -ItemType Directory -Force "$HOME\.opencode\bin" | Out-Null

# 已安装 OpenCode 时先备份
if (Test-Path "$HOME\.opencode\bin\opencode.exe") {
  Copy-Item "$HOME\.opencode\bin\opencode.exe" `
    "$HOME\.opencode\bin\opencode.exe.backup" -Force
}

# 安装修改版；默认假设文件位于“下载”文件夹
Copy-Item "$HOME\Downloads\opencode.exe" `
  "$HOME\.opencode\bin\opencode.exe" -Force
```

验证结果：

```powershell
& "$HOME\.opencode\bin\opencode.exe" --version
```

应显示：

```text
1.17.9
```

### 启动修改版 OpenCode 服务

安装后必须使用上面替换好的文件启动服务。ContextPilot 连接的是
`http://127.0.0.1:4096`；如果该端口运行的是官方 OpenCode，上下文忽略功能
不会生效。

Apple Silicon Mac 和 Intel Mac 使用同一条启动命令：

```bash
~/.opencode/bin/opencode serve --port 4096 --hostname 127.0.0.1
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
