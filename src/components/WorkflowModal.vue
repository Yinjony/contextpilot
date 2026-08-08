<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import AppIcon from './AppIcon.vue'
import ActionIcon from './ActionIcon.vue'

const props = defineProps({
  sessionTitle: { type: String, default: '当前对话' },
  messages: { type: Array, default: () => [] },
})

defineEmits(['close'])

const modalRef = ref(null)
const actionFilter = ref('all')
const selectedNode = ref(null)

const typeMeta = {
  UserRequest: { label: '用户请求', group: 'model' },
  Understand: { label: '理解需求', group: 'model' },
  Decompose: { label: '拆解任务', group: 'tool' },
  SearchContext: { label: '检索上下文', group: 'tool' },
  Plan: { label: '制定计划', group: 'tool' },
  GenerateCode: { label: '生成代码', group: 'tool' },
  RunCommand: { label: '运行命令', group: 'tool' },
  AnalyzeResult: { label: '分析结果', group: 'model' },
  Response: { label: '生成回复', group: 'model' },
  Summarize: { label: '总结归纳', group: 'model' },
  UpdateContext: { label: '更新上下文', group: 'model' },
  SaveFile: { label: '保存文件', group: 'tool' },
  RunTest: { label: '执行测试', group: 'tool' },
  CheckResult: { label: '检查结果', group: 'tool' },
  Optimize: { label: '优化调整', group: 'tool' },
}

const filters = [
  { id: 'all', label: '全部动作' },
  { id: 'model', label: '模型' },
  { id: 'tool', label: '工具' },
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
    detail: detail || part?.text || message.text || '暂无详情',
    time: message.time || '未知时间',
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
  const number = (value) => Number.isFinite(value) ? Math.max(0, value) : 0
  const input = number(usage.input)
  const output = number(usage.output)
  const reasoning = number(usage.reasoning)
  const cacheRead = number(usage.cache?.read)
  const cacheWrite = number(usage.cache?.write)
  const total = Number.isFinite(usage.total)
    ? Math.max(0, usage.total)
    : input + output + reasoning + cacheRead + cacheWrite
  return { input, output, reasoning, cacheRead, cacheWrite, total }
}

const usages = computed(() => props.messages
  .map((message) => normalizeUsage(message.usage))
  .filter(Boolean))

const totalTokenUsage = computed(() => usages.value.reduce((total, usage) => total + usage.total, 0))
const latestUsage = computed(() => usages.value.at(-1))
const contextRemaining = computed(() => {
  const used = latestUsage.value ? latestUsage.value.input + latestUsage.value.cacheRead : 0
  return Math.max(0, contextLimit - used)
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
    completed: '已完成', running: '进行中', pending: '待触发', error: '失败',
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
            <h2 id="workflow-title">执行追踪&对话概况</h2>
            <span class="modal-session-context" :title="sessionTitle">
              <small>当前会话</small>
              <strong>{{ sessionTitle }}</strong>
            </span>
          </div>
        </div>
        <button type="button" class="icon-btn workflow-close" aria-label="关闭工作流" @click="$emit('close')">
          <AppIcon name="x" :size="18" />
        </button>
      </header>

<!--      <div class="workflow-pipeline" aria-label="工作流数据管线">-->
<!--        <span>OpenCode parts</span><i></i><span>标准动作模型</span><i></i><strong>可视化工作流</strong>-->
<!--      </div>-->

      <section class="workflow-context-meter" aria-labelledby="workflow-context-title">
        <div class="workflow-context-head">
          <div>
            <span id="workflow-context-title">上下文容量</span>
            <strong>{{ contextUsageLabel }} 已占用</strong>
          </div>
          <span class="workflow-context-limit">容量 {{ formatTokenCount(contextLimit) }}</span>
        </div>

        <div
          class="workflow-context-track"
          role="progressbar"
          aria-label="当前上下文占用比例"
          :aria-valuenow="Math.round(contextUsagePercent)"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-valuetext="`已占用 ${formatTokenCount(contextUsed)}，剩余 ${formatTokenCount(contextRemaining)}`"
        >
          <span class="workflow-context-used" :style="{ width: `${contextUsagePercent}%` }"></span>
        </div>

        <div class="workflow-context-stats">
          <div class="is-used">
            <span><i></i>当前上下文占用</span>
            <strong>{{ formatTokenCount(contextUsed) }}</strong>
          </div>
          <div class="is-remaining">
            <span><i></i>上下文剩余</span>
            <strong>{{ formatTokenCount(contextRemaining) }}</strong>
          </div>
          <div class="is-total">
            <span>累计 Token 消耗</span>
            <strong>{{ formatTokenCount(totalTokenUsage) }}</strong>
          </div>
        </div>
      </section>

      <div class="workflow-toolbar">
        <div class="workflow-filters" aria-label="动作筛选">
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
        <div class="workflow-legend" aria-label="状态图例">
          <span><i class="completed"></i>完成</span>
          <span><i class="running"></i>进行中</span>
        </div>
      </div>

      <div class="workflow-content">
        <div class="workflow-stage">
          <section class="workflow-lane workflow-main-lane">
            <div class="workflow-main-flow">
              <div class="workflow-flow-heading">
                <div>
                  <strong>执行链路</strong>
                  <span>共 {{ filteredTurns.length }} 轮 · {{ totalActionCount }} 项</span>
                </div>
                <small>按对话轮次分组 · 区域内显示 3 轮</small>
              </div>
              <div v-if="filteredTurns.length" ref="turnsViewportRef" class="workflow-turns-viewport">
                <section v-for="turn in filteredTurns" :key="turn.id" class="workflow-turn">
                  <header class="workflow-turn-header">
                    <span>第 {{ turn.index }} 轮</span>
                    <strong :title="turn.request?.detail || '历史执行'">{{ brief(turn.request?.detail || '历史执行', 48) }}</strong>
                    <small>{{ turn.actions.length }} 项</small>
                  </header>
                  <div class="workflow-turn-track" tabindex="0" :aria-label="`第 ${turn.index} 轮执行链路`">
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
              <div v-else class="workflow-main-empty">当前筛选下暂无动作</div>
            </div>
          </section>

          <section class="workflow-breakdown" aria-label="动作分布">
            <div class="workflow-breakdown-head">
              <strong>动作分布</strong>
              <span>共 {{ totalActionCount }} 个动作</span>
            </div>
            <div class="workflow-breakdown-grid">
              <template v-if="typeBreakdown.length">
                <div
                  v-for="item in typeBreakdown"
                  :key="item.type"
                  class="workflow-breakdown-pill"
                  :data-type="item.type"
                  :title="`${item.label} · ${item.count} 次`"
                >
                  <ActionIcon :type="item.type" :size="16" :prefix="`bd-${item.type}`" />
                  <span class="workflow-breakdown-name">{{ item.label }}</span>
                  <span class="workflow-breakdown-count">{{ item.count }}</span>
                </div>
              </template>
              <div v-else class="workflow-breakdown-empty">暂无动作数据</div>
            </div>
          </section>

        </div>

        <aside v-if="detailNode" class="workflow-detail" aria-live="polite">
          <div class="workflow-detail-heading">
            <span class="workflow-node-icon" :data-type="detailNode.type">
              <ActionIcon :type="detailNode.type" :size="18" :prefix="`detail-${detailNode.id}`" />
            </span>
            <div>
              <small>{{ typeMeta[detailNode.type]?.label || '动作详情' }}</small>
              <h3>{{ detailNode.label }}</h3>
            </div>
          </div>
          <span class="workflow-status" :class="`status-${detailNode.status}`">{{ statusText(detailNode.status) }}</span>
          <p>{{ detailNode.detail }}</p>
          <dl>
            <template v-if="detailNode.category"><dt>分类</dt><dd>{{ detailNode.category }}</dd></template>
            <template v-if="detailNode.priority"><dt>优先级</dt><dd>{{ detailNode.priority }}</dd></template>
            <template v-if="detailNode.messageID"><dt>message</dt><dd><code>{{ detailNode.messageID }}</code></dd></template>
            <template v-if="detailNode.partID"><dt>part</dt><dd><code>{{ detailNode.partID }}</code></dd></template>
            <template v-if="detailNode.callID"><dt>call</dt><dd><code>{{ detailNode.callID }}</code></dd></template>
            <template v-if="detailNode.durationMs !== null && detailNode.durationMs !== undefined"><dt>耗时</dt><dd>{{ formatDuration(detailNode.durationMs) }}</dd></template>
            <template v-if="detailNode.partIDs?.length"><dt>关联 parts</dt><dd class="workflow-part-list"><code v-for="partID in detailNode.partIDs" :key="partID">{{ partID }}</code></dd></template>
          </dl>
        </aside>
      </div>

      <footer class="workflow-footer workflow-footer--simple">
        <button type="button" class="secondary-action" @click="$emit('close')">关闭</button>
      </footer>
    </section>
  </div>
</template>
