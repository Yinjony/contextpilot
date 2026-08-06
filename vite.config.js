import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { spawn, spawnSync } from 'node:child_process'
import net from 'node:net'

// opencode headless 后端端口：默认 4096（与 src/model/chatAdapter.js 的默认 baseUrl 对齐）。
// 可用环境变量 OPENCODE_SERVE_PORT 覆盖；设 VITE_AUTO_START_OPENCODE=false 可彻底禁用自动启动。
const OPENCODE_SERVE_PORT = process.env.OPENCODE_SERVE_PORT || '4096'
const AUTO_START_DISABLED = process.env.VITE_AUTO_START_OPENCODE === 'false'

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
  plugins: [vue(), startOpencodeBackend()],
  optimizeDeps: {
    entries: ['index.html'],
  },
  server: {
    watch: {
      ignored: ['**/src/model/opencode/**'],
    },
  },
})
