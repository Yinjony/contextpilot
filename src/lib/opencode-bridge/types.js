// 纯 JSDoc 类型定义：无运行时代码，仅供编辑器类型提示。
// 由 opencode-bridge/types.ts 转写。下游用 `/** @typedef {import('./types.js').X} X */` 引用。
// 判别联合（OpenCodeEvent / OpenCodeRunPromptUpdate）在这里用宽松表述，
// 因为运行时 client.js 只做 `===` 字符串判断，宽松类型无损。

/**
 * @typedef {typeof fetch} FetchLike
 */

/**
 * @typedef {{ baseUrl: string, username?: string, password?: string, headers?: HeadersInit, fetch?: FetchLike, directory?: string, workspace?: string }} OpenCodeBridgeConfig
 */

/**
 * @typedef {{ providerID: string, modelID: string }} OpenCodeModelRef
 */

/**
 * @typedef {{ id: string, providerID: string, variant?: string }} OpenCodeSessionCreateModelRef
 */

/**
 * @typedef {{ id?: string, type: 'text', text: string, synthetic?: boolean, ignored?: boolean, time?: { start: number, end?: number }, metadata?: Record<string, unknown> }} OpenCodeTextPartInput
 */

/**
 * @typedef {{ id?: string, type: 'file', mime: string, filename?: string, url: string, source?: unknown }} OpenCodeFilePartInput
 */

/**
 * @typedef {{ id?: string, type: 'agent', name: string, source?: { value: string, start: number, end: number } }} OpenCodeAgentPartInput
 */

/**
 * @typedef {{ id?: string, type: 'subtask', prompt: string, description: string, agent: string, model?: OpenCodeModelRef }} OpenCodeSubtaskPartInput
 */

/**
 * @typedef {OpenCodeTextPartInput | OpenCodeFilePartInput | OpenCodeAgentPartInput | OpenCodeSubtaskPartInput} OpenCodePromptPartInput
 */

/**
 * @typedef {{ id: string, parentID?: string, title?: string, time?: unknown, metadata?: Record<string, unknown>, [key: string]: unknown }} OpenCodeSessionInfo
 */

/**
 * @typedef {{ directory?: string, workspace?: string, parentID?: string, title?: string, agent?: string, model?: OpenCodeSessionCreateModelRef, metadata?: Record<string, unknown>, permission?: unknown, workspaceID?: string }} OpenCodeSessionCreateInput
 */

/**
 * @typedef {{ sessionID: string, directory?: string, workspace?: string, messageID?: string, model?: OpenCodeModelRef, agent?: string, noReply?: boolean, tools?: Record<string, boolean>, format?: unknown, system?: string, variant?: string, parts: OpenCodePromptPartInput[] }} OpenCodePromptInput
 */

/**
 * @typedef {{ info?: unknown, message?: unknown, parts?: unknown[], [key: string]: unknown }} OpenCodeMessageWithParts
 */

/**
 * OpenCode global event payload。已知 `type` 变体：
 * server.connected | server.heartbeat | server.instance.disposed |
 * message.part.delta | message.part.updated | message.updated |
 * session.status | session.error
 * @typedef {{ id?: string, type: string, properties?: object }} OpenCodeEvent
 */

/**
 * @typedef {{ directory?: string, project?: string, workspace?: string, payload: OpenCodeEvent }} OpenCodeGlobalEvent
 */

/**
 * @typedef {{ signal?: AbortSignal, reconnect?: boolean, retryDelayMs?: number, maxRetryDelayMs?: number, onSseError?: (error: unknown) => void }} OpenCodeGlobalEventOptions
 */

/**
 * @typedef {{ type: 'connected'|'delta'|'part'|'status'|'error', delta?: string, text?: string, sessionID?: string, messageID?: string, partID?: string, status?: object, error?: unknown, event: OpenCodeGlobalEvent }} OpenCodeRunPromptUpdate
 */

/**
 * @typedef {{ sessionID?: string, directory?: string, workspace?: string, prompt?: string, parts?: OpenCodePromptPartInput[], messageID?: string, model?: OpenCodeModelRef, agent?: string, noReply?: boolean, tools?: Record<string, boolean>, format?: unknown, system?: string, variant?: string, timeoutMs?: number, signal?: AbortSignal, onEvent?: (event: OpenCodeGlobalEvent) => void, onUpdate?: (update: OpenCodeRunPromptUpdate) => void, onDelta?: (delta: string, text: string, event: OpenCodeGlobalEvent) => void }} OpenCodeRunPromptInput
 */

/**
 * @typedef {{ sessionID: string, text: string, partText: Record<string, string>, messageIDs: string[], events: OpenCodeGlobalEvent[] }} OpenCodeRunPromptResult
 */

export {}
