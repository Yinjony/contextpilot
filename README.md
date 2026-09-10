# ContextPilot

> Turning implicit conversational history into visible, selectable, and steerable context.

ContextPilot is a research prototype for context management in long-running human–AI and agent collaboration.

The system uses an isolated supervisor process to analyze conversational history and organize task information into structured, provenance-linked context cards. Users can inspect and select these cards and decide which historical information remains active in subsequent agent calls.

By making inherited context visible and adjustable, ContextPilot helps users maintain task state as goals, requirements, and intermediate decisions evolve across multi-stage work.

## Local Setup

### Prerequisites

- Node.js 20 or higher
- npm
- OpenCode 1.17.9

### Install Dependencies

```bash
npm install
```

### Install the Modified OpenCode

ContextPilot requires a modified build of OpenCode. Download the ZIP matching your machine from the [GitHub Releases](https://github.com/Yinjony/contextpilot/releases) page, **fully extract it**, then run the installer:

| Machine | Download |
| --- | --- |
| Apple Silicon Mac (M1, M2, M3, M4, …) | `opencode-darwin-arm64.zip` |
| Intel Mac | `opencode-darwin-x64.zip` |
| Windows x64 | `opencode-windows-x64.zip` |

**macOS** (x64 or arm64): extract, then run `install-macos.command`:

```bash
chmod +x install-macos.command
./install-macos.command
```

**Windows**: extract, then run `install-windows.cmd`:

```shell
install-windows.cmd
```

> The installer only replaces the OpenCode executable. It **never touches ContextPilot source code, session data, model configuration, or API keys**. If it reports the file is in use, close ContextPilot and all OpenCode terminal windows, then retry.

**Optional**: each Release ships a `checksums.txt`. Verify the download with `shasum -a 256 <file>` (macOS) or `Get-FileHash <file> -Algorithm SHA256` (Windows PowerShell).

### Running ContextPilot

#### Windows

Simply run the npm start command — `vite.config.js` automatically launches the OpenCode server process:

```bash
npm run dev
```

Alternatively, start the OpenCode server first, then run the npm start command:

```bash
opencode serve --port 4096 --hostname 127.0.0.1
```

#### macOS

Simply run the npm start command — the script launches the OpenCode server together with the frontend:

```bash
npm run dev:local
```

Alternatively, start the OpenCode server first, then run the npm start command:

```bash
~/.opencode/bin/opencode serve \
  --port 4096 \
  --hostname 127.0.0.1 \
  --cors http://127.0.0.1:5173 \
  --cors http://localhost:5173
```

### Configure the Project Directory

The current code ships with a hardcoded development directory as the default. In other environments, set the absolute project path explicitly via an environment variable — it must be a directory the machine running the OpenCode server can resolve:

```env
# macOS / Linux example
VITE_OPENCODE_DIRECTORY=/Users/your-name/Documents/contextpilot

# Windows example
VITE_OPENCODE_DIRECTORY=C:\Users\your-name\Projects\contextpilot
```

## Environment Variables

Create a `.env.local` file in the project root:

```env
# Backend: "opencode" (default) or "openai-compatible"
VITE_CHAT_BACKEND=opencode

# OpenCode service
VITE_OPENCODE_BASE_URL=http://127.0.0.1:4096
VITE_OPENCODE_USERNAME=opencode
VITE_OPENCODE_PASSWORD=
VITE_OPENCODE_DIRECTORY=/absolute/path/to/contextpilot

# Model (DeepSeek example)
VITE_OPENCODE_PROVIDER_ID=deepseek
VITE_OPENCODE_MODEL_ID=deepseek-v4-flash
VITE_OPENCODE_AGENT=contextpilot-chat
VITE_OPENCODE_MODEL_VARIANT=

# Streaming and tools
VITE_OPENCODE_STREAMING=true
VITE_OPENCODE_CHAT_ENABLE_TOOLS=true
VITE_OPENCODE_CHAT_TIMEOUT_MS=90000
VITE_OPENCODE_CHAT_MAX_RETRIES=2
VITE_OPENCODE_CHAT_MAX_TOOL_CALLS=4
```

## License

No open-source license has been declared for this repository yet. Until a formal license is added, please do not distribute or use the project commercially by default.
