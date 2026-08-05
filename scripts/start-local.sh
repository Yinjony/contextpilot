#!/bin/zsh

set -euo pipefail

CONTEXTPILOT_DIR="${0:A:h:h}"
OPENCODE_EXECUTABLE="/Users/yuanjiaxin/.opencode/bin/opencode"

if ! /usr/bin/security find-generic-password -a "$USER" -s contextpilot-deepseek >/dev/null 2>&1; then
  echo "未在 macOS 钥匙串中找到 contextpilot-deepseek。"
  echo "请先保存 DeepSeek API Key，再重新运行 npm run dev:local。"
  exit 1
fi

export DEEPSEEK_API_KEY="$(/usr/bin/security find-generic-password -a "$USER" -s contextpilot-deepseek -w)"

cleanup() {
  [[ -n "${OPENCODE_PROCESS_ID:-}" ]] && kill "$OPENCODE_PROCESS_ID" >/dev/null 2>&1 || true
}

trap cleanup EXIT INT TERM
cd "$CONTEXTPILOT_DIR"

"$OPENCODE_EXECUTABLE" serve \
  --hostname 127.0.0.1 \
  --port 4096 \
  --cors http://127.0.0.1:5173 \
  --cors http://localhost:5173 &
OPENCODE_PROCESS_ID=$!

npm run dev -- --host 127.0.0.1 --port 5173
