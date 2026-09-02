<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import AppIcon from './AppIcon.vue'
import ActionIcon from './ActionIcon.vue'

const props = defineProps({
  sessionTitle: { type: String, default: 'Current Chat' },
  messages: { type: Array, default: () => [] },
  sessionUsage: { type: Object, default: null },
})

defineEmits(['close'])

const modalRef = ref(null)
const actionFilter = ref('all')
const selectedNode = ref(null)

const typeMeta = {
  UserRequest: { label: 'User Request', group: 'model' },
  Understand: { label: 'Understand Request', group: 'model' },
  Decompose: { label: 'Decompose Task', group: 'tool' },
  SearchContext: { label: 'Search Context', group: 'tool' },
  Plan: { label: 'Plan', group: 'tool' },
  GenerateCode: { label: 'Generate Code', group: 'tool' },
  RunCommand: { label: 'Run Command', group: 'tool' },
  AnalyzeResult: { label: 'Analyze Result', group: 'model' },
  Response: { label: 'Generate Reply', group: 'model' },
  Summarize: { label: 'Summarize', group: 'model' },
  UpdateContext: { label: 'Update Context', group: 'model' },
  SaveFile: { label: 'Save File', group: 'tool' },
  RunTest: { label: 'Run Test', group: 'tool' },
  CheckResult: { label: 'Check Result', group: 'tool' },
  Optimize: { label: 'Optimize', group: 'tool' },
}

const filters = [
  { id: 'all', label: 'All Actions' },
  { id: 'model', label: 'Model' },
  { id: 'tool', label: 'Tools' },
]

function toolActionType(name = '', detail = '') {
  const value = `${name} ${detail}`.toLowerCase()
  if (/test|pytest|vitest|jest|playwright|test:/.test(value)) return 'RunTest'
  if (/check|verify|inspect|lint|typecheck|status/.test(value)) return 'CheckResult'
  if (/write|save|export/.test(value)) return 'SaveFile'
  if (/edit|patch|create|generate|code/.test(value)) return 'GenerateCode'
  if (/shell|bash|command|exec|terminal/.test(value)) return 'RunCommand'
  if (/read|view|cat|open|search|grep|glob|find|web|fetch/.test(value)) return 'SearchContext'
  if (/plan|todo/.test(value)) return 'Plan'
  if (/task|subagent|agent/.test(value)) return 'Decompose'
  if (/optimi|refactor|improve/.test(value)) return 'Optimize'
  return 'AnalyzeResult'
}

function actionStatus(message, part) {
  if (message.error || part?.status === 'error') return 'error'
  if (message.pending || ['pending', 'running'].includes(part?.status)) return 'running'
  return 'completed'
}

function makeAction(type, message, part, index, detail) {
  const meta = typeMeta[type] || typeMeta.AnalyzeResult
  return {
    id: `${message.id || 'message'}:${part?.id || type}:${index}`,
    type,
    label: meta.label,
    group: meta.group,
    status: actionStatus(message, part),
    detail: detail || part?.text || message.text || 'No details yet',
    time: message.time || 'Unknown time',
    messageID: message.id || '',
    partID: part?.id || '',
    callID: part?.callID || '',
    tool: part?.tool || '',
    durationMs:
      Number.isFinite(part?.startedAt) && Number.isFinite(part?.endedAt)
        ? Math.max(0, part.endedAt - part.startedAt)
        : null,
    error: part?.error || '',
  }
}

const conversationActions = computed(() => {
  const actions = []
  props.messages.forEach((message) => {
    if (message.role === 'user') {
      actions.push(makeAction('UserRequest', message, null, actions.length, message.text))
      return
    }

    const parts = Array.isArray(message.workflowParts) ? message.workflowParts : []
    if (parts.length) {
      parts.forEach((part) => {
        let type = null
        if (part.type === 'reasoning') type = 'Understand'
        if (part.type === 'text') type = 'Response'
        if (part.type === 'compaction') type = 'Summarize'
        if (part.type === 'tool') type = toolActionType(part.tool, part.text)
        if (!type) return
        actions.push(makeAction(type, message, part, actions.length, part.tool || part.text))
      })
      return
    }

    if (message.reasoning) {
      actions.push(makeAction('Understand', message, null, actions.length, message.reasoning))
    }
    if (message.text) {
      actions.push(makeAction('Response', message, null, actions.length, message.text))
    }
  })
  return actions
})

// 动作分布：按类型聚合计数，用来在主对话下方做一览（不受筛选影响，反映整段对话的构成）
const typeBreakdown = computed(() => {
  const counts = new Map()
  conversationActions.value.forEach((action) => {
    counts.set(action.type, (counts.get(action.type) || 0) + 1)
  })
  return [...counts.entries()]
    .map(([type, count]) => ({
      type,
      count,
      label: typeMeta[type]?.label || type,
      group: typeMeta[type]?.group || 'tool',
    }))
    .sort((a, b) => b.count - a.count)
})

const totalActionCount = computed(() => conversationActions.value.length)

// 以用户消息为边界重建会话轮次：一条用户请求及其后的全部 Agent parts
// 属于同一条执行链，直到下一条用户消息出现。
const conversationTurns = computed(() => {
  const turns = []
  let current = null
  conversationActions.value.forEach((action) => {
    if (action.type === 'UserRequest') {
      current = {
        id: action.id,
        index: turns.length + 1,
        request: action,
        actions: [action],
      }
      turns.push(current)
      return
    }
    if (!current) {
      current = {
        id: `turn-unbound-${turns.length + 1}`,
        index: turns.length + 1,
        request: null,
        actions: [],
      }
      turns.push(current)
    }
    current.actions.push(action)
  })
  return turns
})

const filteredTurns = computed(() => conversationTurns.value.map((turn) => ({
  ...turn,
  // 筛选模型/工具时仍保留用户请求作为该链路的语义锚点。
  actions: actionFilter.value === 'all'
    ? turn.actions
    : turn.actions.filter((action) => action.type === 'UserRequest' || action.group === actionFilter.value),
})).filter((turn) => turn.actions.length > 0).reverse())

const turnsViewportRef = ref(null)

async function keepLatestTurnVisible() {
  await nextTick()
  if (turnsViewportRef.value) turnsViewportRef.value.scrollTop = 0
}

const DEFAULT_CONTEXT_LIMIT = 1_000_000
const configuredContextLimit = Number(import.meta.env.VITE_OPENCODE_CONTEXT_LIMIT)
const contextLimit = Number.isFinite(configuredContextLimit) && configuredContextLimit > 0
  ? configuredContextLimit
  : DEFAULT_CONTEXT_LIMIT

function normalizeUsage(usage) {
  if (!usage || typeof usage !== 'object') return null
  const number = (value) => {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? Math.max(0, parsed) : 0
  }
  const input = number(usage.input)
  const output = number(usage.output)
  const reasoning = number(usage.reasoning)
  const cacheRead = number(usage.cache?.read)
  const cacheWrite = number(usage.cache?.write)
  const parsedTotal = Number(usage.total)
  const total = Number.isFinite(parsedTotal)
    ? Math.max(0, parsedTotal)
    : input + output + reasoning + cacheRead + cacheWrite
  return { input, output, reasoning, cacheRead, cacheWrite, total }
}

const usages = computed(() => props.messages
  .map((message) => normalizeUsage(message.usage))
  .filter(Boolean))

const authoritativeSessionUsage = computed(() => normalizeUsage(props.sessionUsage))
const messageTokenUsage = computed(() => usages.value.reduce((total, usage) => total + usage.total, 0))
const totalTokenUsage = computed(() => Math.max(
  authoritativeSessionUsage.value?.total || 0,
  messageTokenUsage.value,
))
const latestUsage = computed(() => usages.value.at(-1))
const currentContextUsage = computed(() => {
  const usage = latestUsage.value || authoritativeSessionUsage.value
  return usage ? usage.input + usage.cacheRead : 0
})
const contextRemaining = computed(() => {
  return Math.max(0, contextLimit - currentContextUsage.value)
})
const contextUsed = computed(() => Math.min(contextLimit, Math.max(0, contextLimit - contextRemaining.value)))
const contextUsagePercent = computed(() => contextLimit > 0 ? (contextUsed.value / contextLimit) * 100 : 0)
const contextUsageLabel = computed(() => `${contextUsagePercent.value.toFixed(1)}%`)

function formatTokenCount(value) {
  if (!Number.isFinite(value)) return '—'
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value % 1_000_000 ? 1 : 0)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(value % 1_000 ? 1 : 0)}K`
  return String(Math.round(value))
}

const detailNode = computed(() => selectedNode.value || filteredTurns.value.at(0)?.actions.at(-1))

function selectNode(node) {
  selectedNode.value = node
}

function statusText(status) {
  return {
    completed: 'Completed', running: 'In Progress', pending: 'Pending', error: 'Failed',
  }[status] || status
}

function formatDuration(durationMs) {
  if (!Number.isFinite(durationMs)) return ''
  return durationMs < 1000 ? `${durationMs} ms` : `${(durationMs / 1000).toFixed(1)} s`
}

function brief(value, max = 24) {
  const text = String(value || '').replace(/\s+/g, ' ').trim()
  return text.length > max ? `${text.slice(0, max)}…` : text
}

onMounted(async () => {
  await nextTick()
  modalRef.value?.focus()
  await keepLatestTurnVisible()
})

watch(() => [filteredTurns.value.length, conversationActions.value.length, actionFilter.value], keepLatestTurnVisible)
</script>

<template>
  <div class="workflow-overlay" @mousedown.self="$emit('close')">
    <section
      ref="modalRef"
      class="workflow-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="workflow-title"
      tabindex="-1"
      @keydown.esc="$emit('close')"
    >
      <header class="workflow-header">
        <div>
          <div class="workflow-title-row">
            <span class="workflow-title-icon"><AppIcon name="workflow" :size="19" /></span>
            <h2 id="workflow-title">Execution Trace & Chat Overview</h2>
            <span class="modal-session-context" :title="sessionTitle">
              <small>Current Chat</small>
              <strong>{{ sessionTitle }}</strong>
            </span>
          </div>
        </div>
        <button type="button" class="icon-btn workflow-close" aria-label="Close workflow" @click="$emit('close')">
          <AppIcon name="x" :size="18" />
        </button>
      </header>

<!--      <div class="workflow-pipeline" aria-label="Workflow data pipeline">-->
<!--        <span>OpenCode parts</span><i></i><span>Standard action model</span><i></i><strong>Visual workflow</strong>-->
<!--      </div>-->

      <section class="workflow-context-meter" aria-labelledby="workflow-context-title">
        <div class="workflow-context-head">
          <div>
            <span id="workflow-context-title">Context Capacity</span>
            <strong>{{ contextUsageLabel }} used</strong>
          </div>
          <span class="workflow-context-limit">Capacity {{ formatTokenCount(contextLimit) }}</span>
        </div>

        <div
          class="workflow-context-track"
          role="progressbar"
          aria-label="Current context usage"
          :aria-valuenow="Math.round(contextUsagePercent)"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-valuetext="`Used ${formatTokenCount(contextUsed)}, remaining ${formatTokenCount(contextRemaining)}`"
        >
          <span class="workflow-context-used" :style="{ width: `${contextUsagePercent}%` }"></span>
        </div>

        <div class="workflow-context-stats">
          <div class="is-used">
            <span><i></i>Current Context Used</span>
            <strong>{{ formatTokenCount(contextUsed) }}</strong>
          </div>
          <div class="is-remaining">
            <span><i></i>Context Remaining</span>
            <strong>{{ formatTokenCount(contextRemaining) }}</strong>
          </div>
          <div class="is-total">
            <span>Total Token Usage</span>
            <strong>{{ formatTokenCount(totalTokenUsage) }}</strong>
          </div>
        </div>
      </section>

      <div class="workflow-toolbar">
        <div class="workflow-filters" aria-label="Action filter">
          <button
            v-for="filter in filters"
            :key="filter.id"
            type="button"
            :class="{ active: actionFilter === filter.id }"
            :aria-pressed="actionFilter === filter.id"
            @click="actionFilter = filter.id"
          >
            {{ filter.label }}
          </button>
        </div>
        <div class="workflow-legend" aria-label="Status legend">
          <span><i class="completed"></i>Done</span>
          <span><i class="running"></i>In Progress</span>
        </div>
      </div>

      <div class="workflow-content">
        <div class="workflow-stage">
          <section class="workflow-lane workflow-main-lane">
            <div class="workflow-main-flow">
              <div class="workflow-flow-heading">
                <div>
                  <strong>Execution Path</strong>
                  <span>{{ filteredTurns.length }} turns · {{ totalActionCount }} items</span>
                </div>
                <small>Grouped by chat turn · showing 4 turns in this area</small>
              </div>
              <div v-if="filteredTurns.length" ref="turnsViewportRef" class="workflow-turns-viewport">
                <section v-for="turn in filteredTurns" :key="turn.id" class="workflow-turn">
                  <header class="workflow-turn-header">
                    <span>Turn {{ turn.index }}</span>
                    <strong :title="turn.request?.detail || 'Previous execution'">{{ brief(turn.request?.detail || 'Previous execution', 48) }}</strong>
                    <small>{{ turn.actions.length }} items</small>
                  </header>
                  <div class="workflow-turn-track" tabindex="0" :aria-label="`Turn ${turn.index} execution path`">
                    <template v-for="(node, i) in turn.actions" :key="node.id">
                      <button
                        type="button"
                        class="workflow-chip"
                        :class="[{ selected: detailNode?.id === node.id }, `status-${node.status}`]"
                        :data-type="node.type"
                        :title="`${node.label} · ${brief(node.tool || node.detail)}`"
                        @click="selectNode(node)"
                      >
                        <ActionIcon :type="node.type" :size="25" :prefix="node.id" />
                        <span class="workflow-chip-label">{{ node.label }}</span>
                      </button>
                      <span v-if="i < turn.actions.length - 1" class="workflow-chip-connector" aria-hidden="true"></span>
                    </template>
                  </div>
                </section>
              </div>
              <div v-else class="workflow-main-empty">No actions for the current filter</div>
            </div>
          </section>

          <section class="workflow-breakdown" aria-label="Action breakdown">
            <div class="workflow-breakdown-head">
              <strong>Action Breakdown</strong>
              <span>{{ totalActionCount }} actions</span>
            </div>
            <div class="workflow-breakdown-grid">
              <template v-if="typeBreakdown.length">
                <div
                  v-for="item in typeBreakdown"
                  :key="item.type"
                  class="workflow-breakdown-pill"
                  :data-type="item.type"
                  :title="`${item.label} · ${item.count} times`"
                >
                  <ActionIcon :type="item.type" :size="16" :prefix="`bd-${item.type}`" />
                  <span class="workflow-breakdown-name">{{ item.label }}</span>
                  <span class="workflow-breakdown-count">{{ item.count }}</span>
                </div>
              </template>
              <div v-else class="workflow-breakdown-empty">No action data yet</div>
            </div>
          </section>

        </div>

        <aside v-if="detailNode" class="workflow-detail" aria-live="polite">
          <div class="workflow-detail-heading">
            <span class="workflow-node-icon" :data-type="detailNode.type">
              <ActionIcon :type="detailNode.type" :size="18" :prefix="`detail-${detailNode.id}`" />
            </span>
            <div>
              <small>{{ typeMeta[detailNode.type]?.label || 'Action Details' }}</small>
              <h3>{{ detailNode.label }}</h3>
            </div>
          </div>
          <span class="workflow-status" :class="`status-${detailNode.status}`">{{ statusText(detailNode.status) }}</span>
          <p>{{ detailNode.detail }}</p>
          <dl>
            <template v-if="detailNode.category"><dt>Category</dt><dd>{{ detailNode.category }}</dd></template>
            <template v-if="detailNode.priority"><dt>Priority</dt><dd>{{ detailNode.priority }}</dd></template>
            <template v-if="detailNode.messageID"><dt>message</dt><dd><code>{{ detailNode.messageID }}</code></dd></template>
            <template v-if="detailNode.partID"><dt>part</dt><dd><code>{{ detailNode.partID }}</code></dd></template>
            <template v-if="detailNode.callID"><dt>call</dt><dd><code>{{ detailNode.callID }}</code></dd></template>
            <template v-if="detailNode.durationMs !== null && detailNode.durationMs !== undefined"><dt>Duration</dt><dd>{{ formatDuration(detailNode.durationMs) }}</dd></template>
            <template v-if="detailNode.partIDs?.length"><dt>Linked parts</dt><dd class="workflow-part-list"><code v-for="partID in detailNode.partIDs" :key="partID">{{ partID }}</code></dd></template>
          </dl>
        </aside>
      </div>

      <footer class="workflow-footer workflow-footer--simple">
        <button type="button" class="secondary-action" @click="$emit('close')">Close</button>
      </footer>
    </section>
  </div>
</template>
