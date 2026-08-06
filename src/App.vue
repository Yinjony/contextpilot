<script setup>
import {onBeforeUnmount, onMounted, reactive, ref, computed, watch} from 'vue'
import SessionSidebar from './components/SessionSidebar.vue'
import ContextWorkbench from './components/ContextWorkbench.vue'
import ChatPanel from './components/ChatPanel.vue'
import SessionConfigModal from './components/SessionConfigModal.vue'
import WorkflowModal from './components/WorkflowModal.vue'
import MigrationExportModal from './components/MigrationExportModal.vue'
import { totalSessions, contextCards } from './data/workspace.js'
import { chatModelLabel, sendChatMessage, sendChatMessageStream, chatStreams, isAbortError, loadHistory, getRemoteBusySessionIds, abortRemoteGeneration, deleteRemoteSession, renameRemoteSession, runSupervisorSummary, saveRemoteCards, getSupervisorCards, createDefaultChatConfig, normalizeChatConfig, saveSessionChatConfig, getDefaultProjectDirectory } from './model/chatAdapter.js'
import { ElMessage } from './lib/notify.js'

const PROJECT_ENVIRONMENTS_STORAGE_KEY = 'contextpilot:project-environments'
const ACTIVE_PROJECT_ENVIRONMENT_STORAGE_KEY = 'contextpilot:active-project-environment'

function normalizeProjectDirectory(value) {
  return String(value || '').trim().replace(/\\/g, '/').replace(/\/+$/, '')
}

function projectDirectoryKey(value) {
  const directory = normalizeProjectDirectory(value)
  return /^[A-Za-z]:\//.test(directory) ? directory.toLowerCase() : directory
}

function projectDisplayName(directory) {
  const parts = normalizeProjectDirectory(directory).split('/').filter(Boolean)
  return parts[parts.length - 1] || directory || '\u9879\u76EE'
}

function loadStoredProjectDirectories(defaultDirectory) {
  try {
    const raw = window.localStorage.getItem(PROJECT_ENVIRONMENTS_STORAGE_KEY)
    const values = raw ? JSON.parse(raw) : []
    const merged = [defaultDirectory, ...(Array.isArray(values) ? values : [])]
    const seen = new Set()
    return merged.filter((value) => {
      const directory = normalizeProjectDirectory(value)
      const key = projectDirectoryKey(directory)
      if (!key || seen.has(key)) return false
      seen.add(key)
      return true
    }).map(normalizeProjectDirectory)
  } catch {
    return [defaultDirectory]
  }
}

function loadActiveProjectDirectory(projects, fallback) {
  try {
    const saved = normalizeProjectDirectory(window.localStorage.getItem(ACTIVE_PROJECT_ENVIRONMENT_STORAGE_KEY))
    return projects.find((directory) => projectDirectoryKey(directory) === projectDirectoryKey(saved)) || fallback
  } catch {
    return fallback
  }
}

const baseContextCards = ref(contextCards.map((card) => ({ ...card })))
const defaultProjectDirectory = normalizeProjectDirectory(getDefaultProjectDirectory())
const projectDirectories = ref(loadStoredProjectDirectories(defaultProjectDirectory))
const activeProjectDirectory = ref(loadActiveProjectDirectory(projectDirectories.value, defaultProjectDirectory))
const projectSessionCache = new Map()
const isLoadingProject = ref(false)

const projectEnvironments = computed(() =>
  projectDirectories.value.map((directory) => ({
    directory,
    name: projectDisplayName(directory),
  })),
)

// 当前活动会话（驱动聊天区标题与消息）
// 当前活动会话（驱动聊天区标题与消息）。
// 启动即用空草稿占位：未连接 opencode 时不再展示 workspace.js 里的 mock 历史会话，
// 真实历史由 onMounted 里的 loadHistory 在连上后端后填充。
const chatSessions = ref([buildNewSession(defaultProjectDirectory)])
const activeSessionId = ref(chatSessions.value[0]?.id || '')
const localSendingSessionIds = ref(new Set())
const remoteBusySessionIds = ref(new Set())
const activeAbortControllers = new Map()
let busyStatusTimer = null

function updateSessionSet(target, sessionId, enabled) {
  const next = new Set(target.value)
  if (enabled) next.add(sessionId)
  else next.delete(sessionId)
  target.value = next
}

async function syncRemoteBusySessions() {
  const ids = await getRemoteBusySessionIds()
  // null 表示状态请求失败；保留上一次结果，避免网络抖动时误解除“生成中”。
  if (ids) remoteBusySessionIds.value = new Set(ids)
}

// 启动时从 opencode 加载真实历史会话；连上后端才有内容，未连接时会话区保持空白。
const isLoadingHistory = ref(true)

function persistProjectDirectories() {
  try {
    window.localStorage.setItem(PROJECT_ENVIRONMENTS_STORAGE_KEY, JSON.stringify(projectDirectories.value))
    window.localStorage.setItem(ACTIVE_PROJECT_ENVIRONMENT_STORAGE_KEY, activeProjectDirectory.value)
  } catch {
    // Local persistence is optional; OpenCode remains the source of sessions.
  }
}

function normalizeProjectSessions(items, directory) {
  return (items || []).map((session) => ({
    ...session,
    directory: normalizeProjectDirectory(session.directory || directory),
  }))
}

function activateProjectSessions(directory, items) {
  const target = normalizeProjectDirectory(directory)
  const next = normalizeProjectSessions(items, target)
  const usable = next.length ? next : [buildNewSession(target)]
  chatSessions.value = usable
  activeSessionId.value = usable[0]?.id || ''
  projectSessionCache.set(projectDirectoryKey(target), usable)
  chatError.value = ''
  const active = usable[0]
  if (active?.needsSupervisorSummary) {
    active.needsSupervisorSummary = false
    const userIndex = active.messages.findLastIndex((message) => message?.role === 'user')
    const latestTurn = userIndex >= 0 ? active.messages.slice(userIndex) : []
    if (latestTurn.some((message) => message?.role === 'assistant' && message.text?.trim())) {
      queueMicrotask(() => runSupervisor(active, latestTurn))
    }
  }
}

async function loadProjectEnvironment(directory, { initial = false } = {}) {
  const target = normalizeProjectDirectory(directory)
  if (!target) return
  isLoadingProject.value = true
  activeProjectDirectory.value = target
  persistProjectDirectories()
  try {
    const { connected, attempted, sessions: remote } = await loadHistory(target)

    // 已连接且有真实历史：直接用远端会话。
    if (connected && remote && remote.length) {
      activateProjectSessions(target, remote)
      return
    }

    // 已连接但当前项目暂无会话：优先恢复切走时缓存的本地草稿，否则给一个空草稿。
    if (connected) {
      const cached = projectSessionCache.get(projectDirectoryKey(target))
      if (cached?.length) {
        activateProjectSessions(target, cached)
        return
      }
      activateProjectSessions(target, [])
      return
    }

    // 未连接 opencode：会话区保持空白（不再回退 mock 历史会话），并提示用户。
    // attempted=false 表示根本没用 opencode 后端（如 openai-compatible 模式），此时不提示。
    activateProjectSessions(target, [])
    if (initial && attempted) {
      ElMessage({
        message: '尚未连接 opencode，会话区暂时为空。请确认 opencode 服务已启动（默认地址 http://127.0.0.1:4096）。',
        type: 'warning',
        duration: 4500,
        showClose: true,
      })
    }
  } finally {
    isLoadingProject.value = false
  }
}

async function selectProjectEnvironment(directory) {
  const target = normalizeProjectDirectory(directory)
  if (!target || projectDirectoryKey(target) === projectDirectoryKey(activeProjectDirectory.value)) return
  if (isSending.value) {
    window.alert('\u6b63\u5728\u751f\u6210\u56de\u590d\uff0c\u8bf7\u7b49\u5f85\u5f53\u524d\u5bf9\u8bdd\u5b8c\u6210\u540e\u518d\u5207\u6362\u9879\u76ee\u3002')
    return
  }
  projectSessionCache.set(projectDirectoryKey(activeProjectDirectory.value), chatSessions.value)
  await loadProjectEnvironment(target)
}

async function createProjectEnvironment() {
  const raw = window.prompt('\u8bf7\u7c98\u8d34\u65b0\u9879\u76ee\u7684\u7edd\u5bf9\u8def\u5f84\uff08\u4f8b\u5982 C:\\\\Projects\\\\my-app\uff09\uff1a', '')
  const target = normalizeProjectDirectory(raw)
  if (!target) return
  if (!projectDirectories.value.some((directory) => projectDirectoryKey(directory) === projectDirectoryKey(target))) {
    projectDirectories.value = [...projectDirectories.value, target]
  }
  persistProjectDirectories()
  await selectProjectEnvironment(target)
}

async function removeProjectEnvironment(directory) {
  const target = normalizeProjectDirectory(directory)
  if (projectDirectoryKey(target) === projectDirectoryKey(defaultProjectDirectory)) {
    window.alert('\u9ed8\u8ba4\u9879\u76ee\u73af\u5883\u4e0d\u80fd\u79fb\u9664\u3002')
    return
  }
  if (!window.confirm('\u4ece\u4fa7\u8fb9\u680f\u79fb\u9664\u9879\u76ee\u73af\u5883\uff1f\u8fd9\u4e0d\u4f1a\u5220\u9664\u4efb\u4f55 OpenCode \u4f1a\u8bdd\u3002')) return
  projectDirectories.value = projectDirectories.value.filter((item) => projectDirectoryKey(item) !== projectDirectoryKey(target))
  projectSessionCache.delete(projectDirectoryKey(target))
  persistProjectDirectories()
  if (projectDirectoryKey(activeProjectDirectory.value) === projectDirectoryKey(target)) {
    await loadProjectEnvironment(projectDirectories.value[0] || defaultProjectDirectory)
  }
}
onMounted(async () => {
  await loadProjectEnvironment(activeProjectDirectory.value, { initial: true })
  isLoadingHistory.value = false
  // 恢复 busy 状态同步：初始拉一次 + 每 3s 轮询，让 UI 实时反映 opencode 端会话状态
  // （刷新后也能恢复“生成中”）。合并 1c16f31 时这两行被意外丢掉，此处补回。
  await syncRemoteBusySessions()
  busyStatusTimer = window.setInterval(syncRemoteBusySessions, 3000)
})

onBeforeUnmount(() => {
  if (busyStatusTimer) window.clearInterval(busyStatusTimer)
  for (const controller of activeAbortControllers.values()) controller.abort()
  activeAbortControllers.clear()
})

const activeSession = computed(
  () => chatSessions.value.find((s) => s.id === activeSessionId.value) ?? chatSessions.value[0],
)
const activeContextCards = computed(() => activeSession.value?.contextCards ?? baseContextCards.value)
const isChartSession = computed(() => activeSession.value?.id === 'chart')

watch(
  () => activeSession.value?.id,
  (newId) => {
    if (newId === 'chart') {
      console.log('Entering chart performance test mode')
    }
  }
)
const isSending = computed(() => {
  const id = activeSession.value?.id
  return Boolean(id && (localSendingSessionIds.value.has(id) || remoteBusySessionIds.value.has(id)))
})
const chatError = ref('')

// 两侧栏收起状态
const sidebarCollapsed = ref(false)
const contextCollapsed = ref(false)
const isChatConfigOpen = ref(false)
const isWorkflowOpen = ref(false)
const isMigrationExportOpen = ref(false)
const isSavingChatConfig = ref(false)
const chatConfigError = ref('')
let inlineConfigSaveTimer = null

function openChatConfig() {
  const session = activeSession.value
  if (!session) return
  if (!session.metadata?.chatConfig) {
    session.metadata = {
      ...(session.metadata || {}),
      type: 'main',
      chatConfig: createDefaultChatConfig(),
    }
  }
  chatConfigError.value = ''
  isWorkflowOpen.value = false
  isMigrationExportOpen.value = false
  isChatConfigOpen.value = true
}

function openWorkflow() {
  if (!activeSession.value) return
  isChatConfigOpen.value = false
  isMigrationExportOpen.value = false
  isWorkflowOpen.value = true
}

function openMigrationExport() {
  if (!activeSession.value) return
  isChatConfigOpen.value = false
  isWorkflowOpen.value = false
  isMigrationExportOpen.value = true
}

function closeChatConfig() {
  if (isSavingChatConfig.value) return
  isChatConfigOpen.value = false
  chatConfigError.value = ''
}

async function saveChatConfig(config) {
  const session = activeSession.value
  if (!session || isSavingChatConfig.value) return

  const chatConfig = normalizeChatConfig(config)
  session.metadata = {
    ...(session.metadata || {}),
    type: 'main',
    chatConfig,
  }
  isSavingChatConfig.value = true
  chatConfigError.value = ''
  try {
    const saved = await saveSessionChatConfig(
      session.id,
      session.title,
      chatConfig,
      session.metadata,
      session.contextCards || [],
      undefined,
      session.directory || activeProjectDirectory.value,
    )
    if (!saved) {
      throw new Error('配置未能同步到数据库，请稍后重试。')
    }
    isChatConfigOpen.value = false
  } catch (error) {
    chatConfigError.value = error instanceof Error ? error.message : '配置保存失败，请稍后重试。'
  } finally {
    isSavingChatConfig.value = false
  }
}

function updateInlineChatConfig(config) {
  const session = activeSession.value
  if (!session) return

  const chatConfig = normalizeChatConfig(config)
  session.metadata = {
    ...(session.metadata || {}),
    type: 'main',
    chatConfig,
  }

  if (inlineConfigSaveTimer) clearTimeout(inlineConfigSaveTimer)
  inlineConfigSaveTimer = window.setTimeout(async () => {
    try {
      const latestConfig = normalizeChatConfig(session.metadata?.chatConfig)
      const saved = await saveSessionChatConfig(
        session.id,
        session.title,
        latestConfig,
        session.metadata,
        session.contextCards || [],
        undefined,
        session.directory || activeProjectDirectory.value,
      )
      if (!saved) throw new Error('配置未能同步到数据库，请稍后重试。')
      chatConfigError.value = ''
    } catch (error) {
      chatConfigError.value = error instanceof Error ? error.message : '配置保存失败，请稍后重试。'
    }
  }, 260)
}

function selectSession(id) {
  activeSessionId.value = id
  chatError.value = ''
  refreshSupervisorCards(id)
}

// 选择对话时：拿副进程 id 缓存到 localStorage，并拉副进程最新总结刷新工作台卡片。
async function refreshSupervisorCards(sessionId) {
  const session = chatSessions.value.find((s) => s.id === sessionId)
  if (!session) return
  const supervisorId = session.metadata?.supervisorSessionId
  if (!supervisorId) return
  session.metadata = { ...(session.metadata || {}), type: 'main', supervisorSessionId: supervisorId }
  try {
    localStorage.setItem(`contextpilot:supervisor:${sessionId}`, supervisorId)
  } catch { /* localStorage 不可用时静默 */ }
  const incoming = await getSupervisorCards(supervisorId, undefined, session.directory || activeProjectDirectory.value)
  if (incoming.length) {
    session.contextCards = mergeCards(session.contextCards || [], incoming)
    persistSessionCards(session)
  }
}

function buildNewSession(directory = activeProjectDirectory.value) {
  const id = `chat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  return {
    id,
    directory: normalizeProjectDirectory(directory),
    title: '新建对话',
    status: '待开始',
    tone: 'progress',
    time: '刚刚',
    summary: '等待第一条消息',
    messages: [],
    metadata: { type: 'main', chatConfig: createDefaultChatConfig() },
    contextCards: [],
    isDraft: true,
  }
}

function createNewSession() {
  const session = buildNewSession(activeProjectDirectory.value)

  chatSessions.value.unshift(session)
  activeSessionId.value = session.id
  projectSessionCache.set(projectDirectoryKey(activeProjectDirectory.value), chatSessions.value)
  chatError.value = ''
}

async function shareSession(id) {
  const session = chatSessions.value.find((item) => item.id === id)
  if (!session) return

  const text = `contexpilot 对话：${session.title}`
  try {
    await navigator.clipboard.writeText(text)
    window.alert('已复制分享信息')
  } catch {
    window.alert(text)
  }
}

async function renameSession(id) {
  const session = chatSessions.value.find((item) => item.id === id)
  if (!session) return

  const nextTitle = window.prompt('重命名对话', session.title)?.trim()
  if (!nextTitle || nextTitle === session.title) return
  const previousTitle = session.title
  const previousSummary = session.summary
  const previousDraftState = session.isDraft
  const previousMetadata = session.metadata
  session.title = nextTitle
  if (session.summary === '等待第一条消息') {
    session.summary = nextTitle
  }
  // 手动命名后的空会话不再参与首次消息自动命名，避免再次覆盖用户标题。
  session.isDraft = false
  session.metadata = { ...(session.metadata || {}), manualTitle: nextTitle }

  const saved = await renameRemoteSession(
    session.id,
    nextTitle,
    session.metadata,
    undefined,
    session.directory || activeProjectDirectory.value,
  )
  if (!saved) {
    session.title = previousTitle
    session.summary = previousSummary
    session.isDraft = previousDraftState
    session.metadata = previousMetadata
    window.alert('会话重命名保存失败，已恢复原名称。请确认 OpenCode 服务正常后重试。')
    return
  }
  projectSessionCache.set(projectDirectoryKey(activeProjectDirectory.value), chatSessions.value)
}

async function deleteSession(id) {
  const index = chatSessions.value.findIndex((item) => item.id === id)
  if (index < 0) return

  const session = chatSessions.value[index]
  if (!window.confirm(`删除对话“${session.title}”？`)) return

  // 后端删除（opencode.db）；失败不阻断前端删除，只提示。
  const ok = await deleteRemoteSession(id, undefined, session.directory || activeProjectDirectory.value)

  chatSessions.value.splice(index, 1)
  if (chatSessions.value.length === 0) {
    const replacement = buildNewSession()
    chatSessions.value.push(replacement)
    activeSessionId.value = replacement.id
  } else if (activeSessionId.value === id) {
    const next = chatSessions.value[Math.min(index, chatSessions.value.length - 1)]
    activeSessionId.value = next.id
  }
  projectSessionCache.set(projectDirectoryKey(activeProjectDirectory.value), chatSessions.value)
  chatError.value = ok ? '' : '后端会话删除失败，刷新后该会话可能仍在。'
}

function updateContextPriority({ id, priority }) {
  const card = activeContextCards.value.find((item) => item.id === id)
  if (!card || !['高', '中', '低'].includes(priority)) return
  card.priority = priority
  const session = activeSession.value
  if (session) persistSessionCards(session)
}

// —— 监督总结（工作台卡片自动生成）——
const summarizingIds = ref(new Set())
const isSummarizing = computed(() => summarizingIds.value.has(activeSessionId.value))
const pendingSupervisorTurns = new Map()

// 主对话 idle 后后台触发：让监督 session 总结对话 → 更新工作台卡片（不阻塞 UI）。
async function runSupervisor(session, turnMessages) {
  if (!session) return
  const queue = pendingSupervisorTurns.get(session.id) || []
  queue.push(turnMessages)
  pendingSupervisorTurns.set(session.id, queue)

  // 同一会话只运行一个监督任务；生成期间到达的新轮次进入队列，避免被静默丢弃。
  if (summarizingIds.value.has(session.id)) return
  summarizingIds.value = new Set(summarizingIds.value).add(session.id)
  try {
    while (queue.length) {
      const nextTurn = queue.shift()
      await summarizeSupervisorTurn(session, nextTurn)
    }
  } finally {
    pendingSupervisorTurns.delete(session.id)
    const next = new Set(summarizingIds.value)
    next.delete(session.id)
    summarizingIds.value = next
  }
}

async function summarizeSupervisorTurn(session, turnMessages) {
  try {
    const { cards: incoming, supervisorId, sourceParts } = await runSupervisorSummary({
      mainSessionId: session.id,
      turnMessages,
      cards: session.contextCards || [],
      mainMetadata: session.metadata,
      directory: session.directory || activeProjectDirectory.value,
    })
    // 同步前端 metadata 的 supervisorSessionId，避免后续 saveRemoteCards 用旧 metadata 覆盖掉绑定。
    if (supervisorId) {
      session.metadata = { ...(session.metadata || {}), type: 'main', supervisorSessionId: supervisorId }
    }
    // 把数据库刚生成的真实 partID 回填到本轮 UI 消息。这样用户从“用户消息”或
    // “AI 消息”手动生成卡片时，也能建立真实关联，而不是得到 partIDs: []。
    let cardAssociationsChanged = false
    if (sourceParts?.length) {
      for (const turnMessage of turnMessages || []) {
        const liveMessage = session.messages.find((message) => message.id === turnMessage.id)
        if (!liveMessage) continue
        const ids = sourceParts
          .filter((part) => part.role === turnMessage.role)
          .map((part) => part.partID)
        liveMessage.partIDs = normalizePartIDs([...(liveMessage.partIDs || []), ...ids])
        for (const card of session.contextCards || []) {
          if (card.sourceMessageID !== turnMessage.id) continue
          const nextPartIDs = normalizePartIDs([...(card.partIDs || []), ...ids])
          if (nextPartIDs.length !== (card.partIDs || []).length) cardAssociationsChanged = true
          card.partIDs = nextPartIDs
        }
      }
    }
    if (incoming?.length) {
      session.contextCards = mergeCards(session.contextCards || [], incoming)
      persistSessionCards(session)
    } else if (cardAssociationsChanged) {
      persistSessionCards(session)
    }
  } catch (error) {
    console.warn('[App] 监督总结失败：', error?.message || error)
  }
}

// 按 topic 增量合并：用户手动选择会保留；但新卡片、内容更新或新增关联 part 的卡片
// 必须自动选中，让刚沉淀/更新的对话立即参与下一轮上下文。
function mergeCards(existing, incoming) {
  const result = [...(existing || [])]
  const byId = new Map()
  const byTopic = new Map()
  const remember = (card, index) => {
    if (card.id) byId.set(card.id, index)
    const topicKey = normalizeCardKey(card.topic || card.title)
    if (topicKey) byTopic.set(topicKey, index)
  }
  result.forEach(remember)

  for (const card of incoming) {
    const topicKey = normalizeCardKey(card.topic || card.title)
    const titleKey = normalizeCardKey(card.title)
    const idIdx = card.id ? byId.get(card.id) : undefined
    const idx = idIdx ?? byTopic.get(topicKey) ?? byTopic.get(titleKey)
    if (idx !== undefined) {
      const nextTopic = card.topic || result[idx].topic || card.title
      const contentChanged =
        result[idx].topic !== nextTopic ||
        result[idx].category !== card.category ||
        result[idx].title !== card.title ||
        result[idx].body !== card.body
      const nextPartIDs = normalizePartIDs([...(result[idx].partIDs || []), ...(card.partIDs || [])])
      const partLinksChanged = nextPartIDs.length !== normalizePartIDs(result[idx].partIDs).length
      result[idx] = {
        ...result[idx],
        topic: nextTopic,
        category: card.category,
        title: card.title,
        body: card.body,
        partIDs: nextPartIDs,
        // 仅在本轮真的新增信息时自动勾选；未变化卡片继续尊重用户的手动取消。
        selected: contentChanged || partLinksChanged ? true : Boolean(result[idx].selected),
        time: contentChanged || partLinksChanged ? `今天 ${currentTime()}` : result[idx].time,
      }
      remember(result[idx], idx)
    } else {
      result.push({
        id: card.id || `card-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        topic: card.topic || card.title,
        category: card.category,
        title: card.title,
        body: card.body,
        partIDs: normalizePartIDs(card.partIDs),
        time: `今天 ${currentTime()}`,
        source: 'AI 总结',
        priority: '中',
        selected: true,
      })
      remember(result[result.length - 1], result.length - 1)
    }
  }
  return result
}

function normalizeCardKey(value) {
  return String(value || '').trim().toLowerCase()
}

function normalizePartIDs(value) {
  if (!Array.isArray(value)) return []
  return [...new Set(value.filter((id) => typeof id === 'string' && id.trim()).map((id) => id.trim()))]
}

function persistSessionCards(session) {
  if (!session) return Promise.resolve(false)
  const cards = (session.contextCards || []).map((card) => ({
    ...card,
    partIDs: normalizePartIDs(card.partIDs),
  }))
  // 先同步本地 metadata，避免监督会话建立/配置保存等并发 PATCH 拿旧 metadata
  // 覆盖刚刚的 selected 状态。
  session.metadata = {
    ...(session.metadata || {}),
    type: 'main',
    contextCards: cards,
  }
  return saveRemoteCards(session.id, cards, session.metadata, undefined, session.directory || activeProjectDirectory.value)
}

// 工作台勾选回写：选中后注入主对话下一轮 prompt。
function toggleCardSelection(id) {
  const card = activeContextCards.value.find((item) => item.id === id)
  if (!card) return
  card.selected = !card.selected
  const session = activeSession.value
  if (session) persistSessionCards(session)
}

async function handleSendMessage(payload) {
  const input = typeof payload === 'string' ? { text: payload, attachments: [] } : (payload || {})
  const attachments = Array.isArray(input.attachments) ? input.attachments : []
  const typedContent = String(input.text || '').trim()
  const content = typedContent || (attachments.length ? `请查看并分析附件：${attachments.map((item) => item.name).join('、')}` : '')
  const session = activeSession.value
  if (!content || !session || localSendingSessionIds.value.has(session.id) || remoteBusySessionIds.value.has(session.id)) return

  chatError.value = ''
  const userMessage = createMessage('user', content, { attachments })
  // 用 reactive 包裹：后续流式 onDelta 频繁改 text 必须经过 proxy 才能触发 UI 更新。
  // 否则 push 进响应式数组后，局部变量仍是原始对象，改它不会重渲染（气泡会卡在占位文本）。
  const assistantMessage = reactive(
    createMessage('assistant', '正在连接模型并生成回复...', { pending: true, reasoning: '' }),
  )

  session.messages.push(userMessage, assistantMessage)
  if (session.isDraft) {
    session.title = createSessionTitle(content)
    session.summary = content
    session.status = '进行中'
    session.isDraft = false
  }
  updateSessionSet(localSendingSessionIds, session.id, true)

  // rAF 节流：onDelta/onReasoning 高频触发，用局部变量收敛，每帧至多写一次响应式字段。
  let pendingText = ''
  let pendingReasoning = ''
  let rafScheduled = false
  let rafId = 0
  const upsertWorkflowPart = (part) => {
    if (!part?.id || !['text', 'reasoning', 'tool', 'compaction'].includes(part.type)) return
    const parts = Array.isArray(assistantMessage.workflowParts)
      ? [...assistantMessage.workflowParts]
      : []
    const index = parts.findIndex((item) => item.id === part.id)
    if (index >= 0) parts[index] = { ...parts[index], ...part }
    else parts.push(part)
    assistantMessage.workflowParts = parts
  }
  const flush = () => {
    rafScheduled = false
    rafId = 0
    assistantMessage.text = pendingText
    assistantMessage.reasoning = pendingReasoning
  }

  const requestController = new AbortController()
  activeAbortControllers.set(session.id, requestController)

  try {
    const selectedCards = (session.contextCards || []).filter((c) => c.selected)
    // “同意写入”按钮只为当前一轮临时开放写文件工具，不改变会话的长期权限设置。
    const requestChatConfig = input.approveWrite
      ? normalizeChatConfig({
          ...(session.metadata?.chatConfig || {}),
          toolPermissions: {
            ...(session.metadata?.chatConfig?.toolPermissions || {}),
            writeFiles: 'allow',
          },
        })
      : session.metadata?.chatConfig
    if (chatStreams) {
      const { text: reply, reasoning, partIDs } = await sendChatMessageStream({
        sessionId: session.id,
        title: session.title,
        messages: session.messages,
        signal: requestController.signal,
        selectedCards,
        chatConfig: requestChatConfig,
        directory: session.directory || activeProjectDirectory.value,
        onDelta: (delta, fullText) => {
          pendingText = fullText
          if (!rafScheduled) {
            rafScheduled = true
            rafId = requestAnimationFrame(flush)
          }
        },
        onReasoning: (reasoningText) => {
          pendingReasoning = reasoningText
          if (!rafScheduled) {
            rafScheduled = true
            rafId = requestAnimationFrame(flush)
          }
        },
        onWorkflowPart: upsertWorkflowPart,
      })
      assistantMessage.text = reply
      if (reasoning) assistantMessage.reasoning = reasoning
      assistantMessage.partIDs = normalizePartIDs(partIDs)
      // 后台触发监督总结，更新工作台卡片（不阻塞 UI）。
      runSupervisor(session, buildSupervisorTurn(userMessage, assistantMessage))
    } else {
      const reply = await sendChatMessage({
        sessionId: session.id,
        title: session.title,
        messages: session.messages,
        selectedCards,
        chatConfig: requestChatConfig,
        directory: session.directory || activeProjectDirectory.value,
      })
      assistantMessage.text = reply
      runSupervisor(session, buildSupervisorTurn(userMessage, assistantMessage))
    }
  } catch (error) {
    if (isAbortError(error) && !/超时|timed out/i.test(error.message)) {
      // 用户主动停止：保留已流式文本；若几乎没内容则标记为已停止。
      if (!assistantMessage.text || assistantMessage.text.startsWith('正在连接')) {
        assistantMessage.text = '(已停止)'
      }
      refreshSessionContext(session, userMessage, assistantMessage)
    } else {
      const message = error instanceof Error ? error.message : '模型调用失败。'
      assistantMessage.text = message
      assistantMessage.error = true
      chatError.value = message
      refreshSessionContext(session, userMessage, assistantMessage)
    }
  } finally {
    if (rafId) cancelAnimationFrame(rafId)
    assistantMessage.pending = false
    updateSessionSet(localSendingSessionIds, session.id, false)
    if (activeAbortControllers.get(session.id) === requestController) {
      activeAbortControllers.delete(session.id)
    }
    await syncRemoteBusySessions()
  }
}

async function handleStopGeneration() {
  const session = activeSession.value
  if (!session) return

  chatError.value = ''
  activeAbortControllers.get(session.id)?.abort()
  const stopped = await abortRemoteGeneration(session.id)
  updateSessionSet(localSendingSessionIds, session.id, false)
  updateSessionSet(remoteBusySessionIds, session.id, false)

  if (!stopped) {
    chatError.value = '停止请求未能同步到 OpenCode，请稍后重试或刷新页面。'
  }
}

function createMessage(role, text, extra = {}) {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    time: currentTime(),
    text,
    ...extra,
  }
}

function buildSupervisorTurn(userMessage, assistantMessage) {
  return [
    { ...userMessage, pending: false, error: false },
    { ...assistantMessage, pending: false, error: false },
  ]
}

function currentTime() {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date())
}

function createSessionTitle(text) {
  const normalized = text.replace(/\s+/g, ' ').trim()
  return normalized.length > 18 ? `${normalized.slice(0, 18)}...` : normalized
}

// 监督总结接管工作台卡片生成，这里不再硬编码覆盖 contextCards。
// 保留签名兼容历史调用点（chatError banner 已负责展示错误，无需卡片）。
function refreshSessionContext() {}
</script>

<template>
  <main
    class="app-shell"
    :class="{ 'hide-sidebar': sidebarCollapsed, 'hide-context': contextCollapsed }"
    aria-label="ContextPilot workspace"
  >
    <SessionSidebar
      :sessions="chatSessions"
      :total-sessions="totalSessions"
      :active-id="activeSessionId"
      :collapsed="sidebarCollapsed"
      :projects="projectEnvironments"
      :active-project-directory="activeProjectDirectory"
      :project-loading="isLoadingProject"
      @select="selectSession"
      @create="createNewSession"
      @share="shareSession"
      @rename="renameSession"
      @delete="deleteSession"
      @collapse="sidebarCollapsed = true"
      @expand="sidebarCollapsed = false"
      @configure="openChatConfig"
      @workflow="openWorkflow"
      @migrate="openMigrationExport"
      @select-project="selectProjectEnvironment"
      @create-project="createProjectEnvironment"
      @remove-project="removeProjectEnvironment"
    />

    <ContextWorkbench
      :cards="activeContextCards"
      :is-summarizing="isSummarizing"
      :collapsed="contextCollapsed"
      @collapse="contextCollapsed = true"
      @expand="contextCollapsed = false"
      @toggle="toggleCardSelection"
      @update-priority="updateContextPriority"
    />

    <ChatPanel
      :title="activeSession.title"
      :messages="activeSession.messages"
      :is-sending="isSending"
      :error="chatError"
      :model-label="chatModelLabel"
      :chat-config="activeSession.metadata?.chatConfig"
      :project-directory="activeSession.directory || activeProjectDirectory"
      v-if="!isChartSession"
      @send="handleSendMessage"
      @stop="handleStopGeneration"
      @update-config="updateInlineChatConfig"
    />

    <ChatPanel
      v-if="isChartSession"
      :title="activeSession.title"
      :messages="activeSession.messages"
      :is-sending="isSending"
      :error="chatError"
      :model-label="chatModelLabel"
      :chat-config="activeSession.metadata?.chatConfig"
      :project-directory="activeSession.directory || activeProjectDirectory"
      @send="handleSendMessage"
      @stop="handleStopGeneration"
      @update-config="updateInlineChatConfig"
    />

    <SessionConfigModal
      v-if="isChatConfigOpen && activeSession"
      :session-title="activeSession.title"
      :config="activeSession.metadata?.chatConfig"
      :saving="isSavingChatConfig"
      :error="chatConfigError"
      @close="closeChatConfig"
      @save="saveChatConfig"
    />

    <WorkflowModal
      v-if="isWorkflowOpen && activeSession"
      :session-title="activeSession.title"
      :messages="activeSession.messages"
      @close="isWorkflowOpen = false"
    />

    <MigrationExportModal
      v-if="isMigrationExportOpen"
      :sessions="activeSession ? [activeSession] : []"
      :directory="activeProjectDirectory"
      :session-title="activeSession?.title || '未选择会话'"
      @close="isMigrationExportOpen = false"
    />
  </main>
</template>
