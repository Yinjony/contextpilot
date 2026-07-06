// SSE 解析器，逻辑对应 OpenCode SDK 里的 server-sent events 处理。
// 由 opencode-bridge/sse.ts 翻译为纯 JS，行为与 TS 版逐行等价。

export class OpenCodeSseError extends Error {
  constructor(message, response) {
    super(message)
    this.name = 'OpenCodeSseError'
    this.response = response
  }
}

export function isAbortError(error) {
  return error !== null && typeof error === 'object' && 'name' in error && error.name === 'AbortError'
}

function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer)
        reject(new DOMException('Aborted', 'AbortError'))
      },
      { once: true },
    )
  })
}

function parseSseChunk(chunk) {
  const lines = chunk.split('\n')
  const dataLines = []
  let eventName
  let id
  let retry

  for (const line of lines) {
    if (line.startsWith('data:')) {
      dataLines.push(line.replace(/^data:\s*/, ''))
      continue
    }
    if (line.startsWith('event:')) {
      eventName = line.replace(/^event:\s*/, '')
      continue
    }
    if (line.startsWith('id:')) {
      id = line.replace(/^id:\s*/, '')
      continue
    }
    if (line.startsWith('retry:')) {
      const parsed = Number.parseInt(line.replace(/^retry:\s*/, ''), 10)
      if (!Number.isNaN(parsed)) retry = parsed
    }
  }

  if (dataLines.length === 0) return

  const rawData = dataLines.join('\n')
  let data = rawData
  try {
    data = JSON.parse(rawData)
  } catch {
    // SSE allows non-JSON data. OpenCode sends JSON, but keeping this parser
    // tolerant makes diagnostics easier when a proxy returns text.
  }

  return {
    data,
    event: eventName,
    id,
    retry,
  }
}

async function* readSseResponse(response, signal) {
  if (!response.body) throw new OpenCodeSseError('No body in SSE response', response)

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  const abortHandler = () => {
    reader.cancel().catch(() => undefined)
  }
  signal?.addEventListener('abort', abortHandler)

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      buffer = buffer.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

      const chunks = buffer.split('\n\n')
      buffer = chunks.pop() ?? ''

      for (const chunk of chunks) {
        const parsed = parseSseChunk(chunk)
        if (parsed) yield parsed
      }
    }
  } finally {
    signal?.removeEventListener('abort', abortHandler)
    reader.releaseLock()
  }
}

export async function* streamSseJson(input) {
  const fetchFn = input.fetchFn ?? fetch
  let attempt = 0
  let retryDelay = input.retryDelayMs ?? 3000
  const maxRetryDelay = input.maxRetryDelayMs ?? 30000

  while (!input.signal?.aborted) {
    try {
      const headers = new Headers(input.headers)
      headers.set('Accept', 'text/event-stream')

      const response = await fetchFn(input.url, {
        method: 'GET',
        headers,
        signal: input.signal,
      })

      if (!response.ok) {
        throw new OpenCodeSseError(`SSE failed: ${response.status} ${response.statusText}`, response)
      }

      attempt = 0
      for await (const event of readSseResponse(response, input.signal)) {
        if (event.retry !== undefined) retryDelay = event.retry
        yield event.data
      }

      if (!input.reconnect) break
    } catch (error) {
      if (input.signal?.aborted || isAbortError(error)) return
      input.onSseError?.(error)
      if (!input.reconnect) throw error

      attempt += 1
      const backoff = Math.min(retryDelay * 2 ** Math.max(0, attempt - 1), maxRetryDelay)
      await sleep(backoff, input.signal)
    }
  }
}
