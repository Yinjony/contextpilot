// 最小调用示例。由 opencode-bridge/example.ts 翻译为纯 JS。
// 需要把 baseUrl 换成你的 OpenCode server 地址。
import { createOpenCodeBridge } from './index.js'

const client = createOpenCodeBridge({
  baseUrl: 'https://your-opencode-server.example.com',
  // password: 'your-server-password',
  // directory: '/workspace/project-on-server',
})

const result = await client.runPrompt({
  prompt: '请用一句话介绍当前项目。',
  timeoutMs: 120000,
  onDelta(delta) {
    console.log(delta)
  },
})

console.log('session:', result.sessionID)
console.log('answer:', result.text)
