$ErrorActionPreference = "Stop"

$ExpectedVersion = "1.17.9"
$Marker = "contextpilot.context-part-ids"
$Source = Join-Path $PSScriptRoot "opencode.exe"
$InstallDirectory = Join-Path $HOME ".opencode\bin"
$Target = Join-Path $InstallDirectory "opencode.exe"
$TemporaryTarget = Join-Path $InstallDirectory (".opencode.install.{0}.exe" -f $PID)

function Test-BytePattern {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$Pattern
    )

    $Buffer = New-Object byte[] (1024 * 1024)
    $Tail = ""
    $Stream = [System.IO.File]::OpenRead($Path)

    try {
        while (($Count = $Stream.Read($Buffer, 0, $Buffer.Length)) -gt 0) {
            $Text = $Tail + [System.Text.Encoding]::ASCII.GetString($Buffer, 0, $Count)
            if ($Text.IndexOf($Pattern, [System.StringComparison]::Ordinal) -ge 0) {
                return $true
            }

            $TailLength = [Math]::Min($Pattern.Length - 1, $Text.Length)
            $Tail = $Text.Substring($Text.Length - $TailLength)
        }
    }
    finally {
        $Stream.Dispose()
    }

    return $false
}

function Get-PeMachine {
    param([Parameter(Mandatory = $true)][string]$Path)

    $Stream = [System.IO.File]::OpenRead($Path)
    $Reader = New-Object System.IO.BinaryReader($Stream)

    try {
        if ($Reader.ReadUInt16() -ne 0x5A4D) {
            throw "文件不是有效的 Windows PE 程序（缺少 MZ 标记）。"
        }

        $Stream.Position = 0x3C
        $PeOffset = $Reader.ReadInt32()
        $Stream.Position = $PeOffset

        if ($Reader.ReadUInt32() -ne 0x00004550) {
            throw "文件不是有效的 Windows PE 程序（缺少 PE 标记）。"
        }

        return $Reader.ReadUInt16()
    }
    finally {
        $Reader.Dispose()
        $Stream.Dispose()
    }
}

function Get-OpenCodeVersion {
    param([Parameter(Mandatory = $true)][string]$Path)

    $Output = & $Path --version
    if ($LASTEXITCODE -ne 0) {
        throw "无法运行 $Path --version。"
    }
    return ($Output | Out-String).Trim()
}

Write-Host "ContextPilot 修改版 OpenCode Windows 安装程序"
Write-Host "================================================"

if (-not $IsWindows -and $PSVersionTable.PSEdition -eq "Core") {
    throw "此脚本只能在 Windows 上运行。"
}

if (-not [Environment]::Is64BitOperatingSystem) {
    throw "此安装包只支持 64 位 Windows。"
}

if (-not (Test-Path -LiteralPath $Source -PathType Leaf)) {
    throw "脚本同目录中未找到 opencode.exe。请完整解压 ZIP，不要单独移动安装脚本。"
}

if ((Get-PeMachine -Path $Source) -ne 0x8664) {
    throw "opencode.exe 不是 Windows x64 程序，请下载正确的安装包。"
}

if (-not (Test-BytePattern -Path $Source -Pattern $Marker)) {
    throw "opencode.exe 不包含 ContextPilot 上下文筛选标记，请重新下载安装包。"
}

Unblock-File -LiteralPath $Source -ErrorAction SilentlyContinue
$SourceVersion = Get-OpenCodeVersion -Path $Source
if ($SourceVersion -ne $ExpectedVersion) {
    throw "版本不正确：预期 $ExpectedVersion，实际 $SourceVersion。"
}

New-Item -ItemType Directory -Path $InstallDirectory -Force | Out-Null

try {
    Copy-Item -LiteralPath $Source -Destination $TemporaryTarget -Force
    Unblock-File -LiteralPath $TemporaryTarget -ErrorAction SilentlyContinue

    $TemporaryVersion = Get-OpenCodeVersion -Path $TemporaryTarget
    if ($TemporaryVersion -ne $ExpectedVersion) {
        throw "安装前验证失败。"
    }

    if (Test-Path -LiteralPath $Target -PathType Leaf) {
        $Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
        $Backup = Join-Path $InstallDirectory "opencode.exe.backup-$Timestamp"
        Copy-Item -LiteralPath $Target -Destination $Backup -Force
        Write-Host "原版本已备份到：$Backup"
    }

    Move-Item -LiteralPath $TemporaryTarget -Destination $Target -Force
}
catch {
    Remove-Item -LiteralPath $TemporaryTarget -Force -ErrorAction SilentlyContinue
    throw "安装失败。请关闭正在运行的 OpenCode 后重试。原文件备份不会被删除。`n$($_.Exception.Message)"
}

$InstalledVersion = Get-OpenCodeVersion -Path $Target
if ($InstalledVersion -ne $ExpectedVersion -or -not (Test-BytePattern -Path $Target -Pattern $Marker)) {
    throw "安装后验证失败。"
}

Write-Host
Write-Host "安装成功：$Target" -ForegroundColor Green
Write-Host "版本：$InstalledVersion"
Write-Host "架构：Windows x64"
Write-Host
Write-Host "如果 4096 端口已有官方 OpenCode 在运行，请先关闭旧服务。"
Write-Host "然后执行："
Write-Host "& `"$Target`" serve --port 4096 --hostname 127.0.0.1"
