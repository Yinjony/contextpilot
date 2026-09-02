import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { execFile } from 'node:child_process'
import { spawn, spawnSync } from 'node:child_process'
import net from 'node:net'
import { mkdir, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'

// opencode headless 后端端口：默认 4096（与 src/model/chatAdapter.js 的默认 baseUrl 对齐）。
// 可用环境变量 OPENCODE_SERVE_PORT 覆盖；设 VITE_AUTO_START_OPENCODE=false 可彻底禁用自动启动。
const OPENCODE_SERVE_PORT = process.env.OPENCODE_SERVE_PORT || '4096'
const AUTO_START_DISABLED = process.env.VITE_AUTO_START_OPENCODE === 'false'

function runFilePicker(command, args) {
  return new Promise((resolve, reject) => {
    execFile(command, args, { encoding: 'utf8' }, (error, stdout) => {
      if (error) {
        // Native pickers use a non-zero exit code when the user presses Cancel.
        if (error.code === 1 || error.code === 130) resolve('')
        else reject(error)
        return
      }
      resolve(String(stdout || '').trim())
    })
  })
}

async function selectLocalDirectory() {
  if (process.platform === 'darwin') {
    return runFilePicker('osascript', [
      '-e',
      'POSIX path of (choose folder with prompt "选择项目文件夹")',
    ])
  }
  if (process.platform === 'win32') {
    const script = [
      'Add-Type -AssemblyName System.Windows.Forms',
      '$dialog = New-Object System.Windows.Forms.FolderBrowserDialog',
      '$dialog.Description = "选择项目文件夹"',
      '$dialog.ShowNewFolderButton = $true',
      'if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { $dialog.SelectedPath }',
    ].join('; ')
    return runFilePicker('powershell.exe', ['-NoProfile', '-STA', '-Command', script])
  }
  return runFilePicker('zenity', ['--file-selection', '--directory', '--title=选择项目文件夹'])
}

function localDirectoryPicker() {
  return {
    name: 'contextpilot:local-directory-picker',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__contextpilot/select-directory', async (request, response) => {
        response.setHeader('Content-Type', 'application/json; charset=utf-8')
        if (request.method !== 'POST') {
          response.statusCode = 405
          response.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }
        try {
          const directory = await selectLocalDirectory()
          response.end(JSON.stringify({ directory }))
        } catch (error) {
          response.statusCode = 500
          response.end(JSON.stringify({ error: error?.message || '无法打开文件夹选择器' }))
        }
      })
    },
  }
}

function readJsonBody(request, limit = 25 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    request.on('data', (chunk) => {
      size += chunk.length
      if (size > limit) {
        reject(new Error('会话数据超过 25MB，无法保存。'))
        request.destroy()
        return
      }
      chunks.push(chunk)
    })
    request.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'))
      } catch {
        reject(new Error('会话数据格式无效。'))
      }
    })
    request.on('error', reject)
  })
}

function experimentDataWriter() {
  return {
    name: 'contextpilot:experiment-data-writer',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__contextpilot/sync-experiment-data', async (request, response) => {
        response.setHeader('Content-Type', 'application/json; charset=utf-8')
        if (request.method !== 'POST') {
          response.statusCode = 405
          response.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }
        try {
          const payload = await readJsonBody(request)
          const requestedDirectory = String(payload?.projectDirectory || '').trim()
          if (!requestedDirectory || !path.isAbsolute(requestedDirectory) || !Array.isArray(payload?.sessions)) {
            throw new Error('缺少有效的项目目录或会话数据。')
          }
          const projectDirectory = path.resolve(requestedDirectory)

          const dataDirectory = path.join(projectDirectory, 'experiment-data')
          const target = path.join(dataDirectory, 'sessions.json')
          const temporary = path.join(dataDirectory, '.sessions.json.tmp')
          await mkdir(dataDirectory, { recursive: true })
          await writeFile(
            temporary,
            `${JSON.stringify({
              schemaVersion: 1,
              projectDirectory,
              savedAt: new Date().toISOString(),
              sessions: payload.sessions,
            }, null, 2)}\n`,
            'utf8',
          )
          await rename(temporary, target)
          response.end(JSON.stringify({ ok: true, file: target }))
        } catch (error) {
          response.statusCode = 500
          response.end(JSON.stringify({ error: error?.message || '保存实验会话失败。' }))
        }
      })
    },
  }
}

// 探测端口是否已被占用（说明 opencode 已在运行），避免重复启动导致端口冲突。
function isPortInUse(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const tester = net.createServer()
    tester.once('error', () => resolve(true))
    tester.once('listening', () => tester.close(() => resolve(false)))
    tester.listen(port, host)
  })
}

// 开发服务器启动时自动拉起 `opencode serve`，省去手动另开终端。
// 仅 `vite dev` 生效（apply: 'serve'）；opencode 缺失或端口被占时只告警、不阻断前端。
function startOpencodeBackend() {
  let child = null
  let stopping = false
  // Windows 的 opencode 是 .cmd 垫片，必须经 shell 启动；Unix 直接 spawn，便于精确 kill。
  const isWindows = process.platform === 'win32'

  // 同步结束 opencode 进程树。用 spawnSync 保证即便在 process 'exit' 信号回调里
  // （Node 即将退出）也能在父进程死掉之前真正把后端杀掉，避免遗留孤儿进程。
  function stop() {
    if (stopping || !child) return
    stopping = true
    const target = child
    child = null
    const pid = target.pid
    if (pid == null) return
    try {
      if (target.exitCode !== null || target.signalCode !== null) return
      if (isWindows) {
        // shell:true 下 PID 属于 cmd.exe，需用 /T 连带其子进程 opencode 一起结束。
        spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], {
          windowsHide: true,
          stdio: 'ignore',
        })
      } else {
        process.kill(pid, 'SIGTERM')
      }
    } catch (error) {
      console.warn('[opencode] 停止 opencode 进程失败：', error?.message || error)
    }
  }

  // 前端被 Ctrl+C / kill / 关闭终端时：先同步结束后端，再把信号交还给默认流程，
  // 保留原始退出码（SIGINT→130 等），也不干扰 Vite 自身的退出处理。
  function bindGracefulSignal(sig) {
    const handler = () => {
      stop()
      process.off(sig, handler)
      process.kill(process.pid, sig)
    }
    process.on(sig, handler)
  }

  return {
    name: 'contextpilot:start-opencode',
    apply: 'serve',
    configureServer(server) {
      if (AUTO_START_DISABLED) return

      // 三重保险：HTTP server 正常关闭、Node 进程退出、外部终止信号。
      server.httpServer.on('close', stop)
      process.on('exit', stop)
      bindGracefulSignal('SIGINT')
      bindGracefulSignal('SIGTERM')
      bindGracefulSignal('SIGHUP')

      ;(async () => {
        if (await isPortInUse(Number(OPENCODE_SERVE_PORT))) {
          console.log(
            `[opencode] 检测到端口 ${OPENCODE_SERVE_PORT} 已有服务，跳过自动启动（复用已有 opencode）。`,
          )
          return
        }

        try {
          child = spawn('opencode', ['serve', '--port', String(OPENCODE_SERVE_PORT)], {
            ...(isWindows ? { shell: true } : {}),
            windowsHide: true,
          })
        } catch (error) {
          console.warn(`[opencode] 自动启动失败（不影响前端）：${error?.message || error}`)
          return
        }

        console.log(`[opencode] 正在启动 opencode serve --port ${OPENCODE_SERVE_PORT} …`)
        const write = (stream, chunk) => {
          for (const line of chunk.toString().split(/\r?\n/)) {
            if (line) process[stream].write(`[opencode] ${line}\n`)
          }
        }
        child.stdout?.on('data', (d) => write('stdout', d))
        child.stderr?.on('data', (d) => write('stderr', d))
        child.on('error', (error) => {
          if (error.code === 'ENOENT') {
            console.warn(
              `[opencode] 未找到 opencode 命令，请先安装 opencode 并确认其在 PATH 中。后端需手动启动：opencode serve --port ${OPENCODE_SERVE_PORT}`,
            )
          } else {
            console.warn(`[opencode] 启动出错：${error.message}`)
          }
        })
        child.on('exit', (code, signal) => {
          // stopping 表示是我们主动结束的，不要当成异常退出告警。
          if (stopping || signal) return
          if (code && code !== 0) {
            console.warn(
              `[opencode] 进程退出（exit ${code}）。可能是未登录、端口 ${OPENCODE_SERVE_PORT} 被占用，或 opencode 版本不兼容。`,
            )
          }
        })
      })()
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), localDirectoryPicker(), experimentDataWriter(), startOpencodeBackend()],
  optimizeDeps: {
    entries: ['index.html'],
  },
  server: {
    watch: {
      ignored: ['**/src/model/opencode/**'],
    },
  },
})
