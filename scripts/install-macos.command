#!/bin/bash

set -euo pipefail

EXPECTED_VERSION="1.17.9"
MARKER="contextpilot.context-part-ids"
SCRIPT_DIR="$(cd -- "$(dirname -- "$0")" && pwd)"
SOURCE="$SCRIPT_DIR/opencode"
INSTALL_DIR="$HOME/.opencode/bin"
TARGET="$INSTALL_DIR/opencode"
TEMP_TARGET="$INSTALL_DIR/.opencode.install.$$"

finish() {
  status=$?
  rm -f "$TEMP_TARGET"
  echo
  if [ "$status" -eq 0 ]; then
    echo "安装流程已完成。"
  else
    echo "安装失败，原有 OpenCode 未被无备份覆盖。"
  fi
  read -r -p "按回车键关闭此窗口……" _ || true
  exit "$status"
}

trap finish EXIT

echo "ContextPilot 修改版 OpenCode 安装程序"
echo "======================================"

if [ "$(uname -s)" != "Darwin" ]; then
  echo "错误：此脚本只能在 macOS 上运行。"
  exit 1
fi

if [ ! -f "$SOURCE" ]; then
  echo "错误：脚本同目录中未找到 opencode。"
  echo "请完整解压 ZIP，不要单独移动 install-macos.command。"
  exit 1
fi

MACHINE_ARCH="$(uname -m)"
FILE_INFO="$(file -b "$SOURCE")"

case "$MACHINE_ARCH" in
  arm64)
    REQUIRED_ARCH="arm64"
    ;;
  x86_64)
    REQUIRED_ARCH="x86_64"
    ;;
  *)
    echo "错误：不支持的 Mac 架构：$MACHINE_ARCH"
    exit 1
    ;;
esac

if [[ "$FILE_INFO" != *"$REQUIRED_ARCH"* ]]; then
  echo "错误：安装包架构与当前 Mac 不匹配。"
  echo "当前 Mac：$MACHINE_ARCH"
  echo "下载文件：$FILE_INFO"
  echo "请下载与 uname -m 输出匹配的 ZIP。"
  exit 1
fi

chmod +x "$SOURCE"
xattr -d com.apple.quarantine "$SOURCE" 2>/dev/null || true

SOURCE_VERSION="$("$SOURCE" --version)"
if [ "$SOURCE_VERSION" != "$EXPECTED_VERSION" ]; then
  echo "错误：版本不正确，预期 $EXPECTED_VERSION，实际 $SOURCE_VERSION。"
  exit 1
fi

if ! LC_ALL=C grep -aFq "$MARKER" "$SOURCE"; then
  echo "错误：此文件不包含 ContextPilot 上下文筛选标记。"
  echo "安装已停止，请重新下载研究人员提供的修改版。"
  exit 1
fi

mkdir -p "$INSTALL_DIR"

if [ -f "$TARGET" ]; then
  TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
  BACKUP="$INSTALL_DIR/opencode.backup-$TIMESTAMP"
  cp -p "$TARGET" "$BACKUP"
  echo "原版本已备份到：$BACKUP"
fi

cp "$SOURCE" "$TEMP_TARGET"
chmod 755 "$TEMP_TARGET"
xattr -d com.apple.quarantine "$TEMP_TARGET" 2>/dev/null || true

INSTALLED_VERSION="$("$TEMP_TARGET" --version)"
if [ "$INSTALLED_VERSION" != "$EXPECTED_VERSION" ]; then
  echo "错误：安装前验证失败。"
  exit 1
fi

mv -f "$TEMP_TARGET" "$TARGET"

echo
echo "安装成功：$TARGET"
echo "版本：$INSTALLED_VERSION"
echo "架构：$MACHINE_ARCH"
echo
echo "如果 4096 端口已有官方 OpenCode 在运行，请先关闭旧服务。"
echo "然后执行："
echo "$TARGET serve --port 4096 --hostname 127.0.0.1"
