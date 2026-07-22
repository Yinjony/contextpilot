<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
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
  Think: { label: '模型思考', group: 'model' },
  Response: { label: '生成回复', group: 'model' },
  Read: { label: '读取', group: 'tool' },
  Write: { label: '写入', group: 'tool' },
  Shell: { label: '命令', group: 'tool' },
  Search: { label: '搜索', group: 'tool' },
  Plan: { label: '计划', group: 'tool' },
  Subagent: { label: '子代理', group: 'tool' },
  Skill: { label: '技能', group: 'tool' },
  Compaction: { label: '上下文压缩', group: 'model' },
  Tool: { label: '工具调用', group: 'tool' },
}

const filters = [
  { id: 'all', label: '全部动作' },
  { id: 'model', label: '模型' },
  { id: 'tool', label: '工具' },
]

function toolActionType(name = '') {
  const value = String(name).toLowerCase()
  if (/read|view|cat|open/.test(value)) return 'Read'
  if (/write|edit|patch|create/.test(value)) return 'Write'
  if (/shell|bash|command|exec|terminal/.test(value)) return 'Shell'
  if (/search|grep|glob|find|web/.test(value)) return 'Search'
  if (/plan|todo/.test(value)) return 'Plan'
  if (/task|subagent|agent/.test(value)) return 'Subagent'
  if (/skill/.test(value)) return 'Skill'
  return 'Tool'
}

function actionStatus(message, part) {
  if (message.error || part?.status === 'error') return 'error'
  if (message.pending || ['pending', 'running'].includes(part?.status)) return 'running'
  return 'completed'
}

function makeAction(type, message, part, index, detail) {
  const meta = typeMeta[type] || typeMeta.Tool
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
        if (part.type === 'reasoning') type = 'Think'
        if (part.type === 'text') type = 'Response'
        if (part.type === 'compaction') type = 'Compaction'
        if (part.type === 'tool') type = toolActionType(part.tool)
        if (!type) return
        actions.push(makeAction(type, message, part, actions.length, part.tool || part.text))
      })
      return
    }

    if (message.reasoning) {
      actions.push(makeAction('Think', message, null, actions.length, message.reasoning))
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

const filteredActions = computed(() => {
  const source = actionFilter.value === 'all'
    ? conversationActions.value
    : conversationActions.value.filter((action) => action.group === actionFilter.value)
  return source.slice(-20)
})

const hiddenActionCount = computed(() => {
  const sourceCount = actionFilter.value === 'all'
    ? conversationActions.value.length
    : conversationActions.value.filter((action) => action.group === actionFilter.value).length
  return Math.max(0, sourceCount - filteredActions.value.length)
})

// 蛇形布局：按容器宽度算每行 chip 数，再把动作切成多行；奇偶行方向交替实现「拐弯」。
const flowRef = ref(null)
const chipsPerRow = ref(8)
let resizeObserver = null

function recalcPerRow() {
  const el = flowRef.value
  if (!el) return
  const contentWidth = Math.max(0, el.clientWidth - 36) // 减去左右 18px 内边距
  const n = Math.floor((contentWidth + 16) / 66) // 每 chip 50 + 连接器约 16
  chipsPerRow.value = Math.max(3, Math.min(12, n))
}

const actionRows = computed(() => {
  const list = filteredActions.value
  const size = chipsPerRow.value
  const rows = []
  for (let i = 0; i < list.length; i += size) {
    rows.push(list.slice(i, i + size))
  }
  return rows
})

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

function formatTokenCount(value) {
  if (!Number.isFinite(value)) return '—'
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value % 1_000_000 ? 1 : 0)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(value % 1_000 ? 1 : 0)}K`
  return String(Math.round(value))
}

const metrics = computed(() => [
  { label: 'Token 消耗', value: formatTokenCount(totalTokenUsage.value) },
  { label: '上下文剩余', value: formatTokenCount(contextRemaining.value) },
])

const detailNode = computed(() => selectedNode.value || filteredActions.value.at(-1))

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
  recalcPerRow()
  if (flowRef.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(recalcPerRow)
    resizeObserver.observe(flowRef.value)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
})
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
            <h2 id="workflow-title">执行追踪&项目概况</h2>
            <span>{{ sessionTitle }}</span>
          </div>
          <p>将 OpenCode 消息 part 映射为可追溯的执行动作。</p>
        </div>
        <button type="button" class="icon-btn workflow-close" aria-label="关闭工作流" @click="$emit('close')">
          <AppIcon name="x" :size="18" />
        </button>
      </header>

<!--      <div class="workflow-pipeline" aria-label="工作流数据管线">-->
<!--        <span>OpenCode parts</span><i></i><span>标准动作模型</span><i></i><strong>可视化工作流</strong>-->
<!--      </div>-->

      <div class="workflow-metrics" aria-label="工作流统计">
        <div v-for="metric in metrics" :key="metric.label">
          <strong>{{ metric.value }}</strong>
          <span>{{ metric.label }}</span>
        </div>
      </div>

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
            <div class="workflow-lane-label">
              <strong>主对话</strong>
              <span>按 part 时间排序 · 点击方块查看详情</span>
            </div>
            <div ref="flowRef" class="workflow-main-flow">
              <span v-if="hiddenActionCount && filteredActions.length" class="workflow-overflow-note">较早 {{ hiddenActionCount }} 项</span>
              <template v-if="filteredActions.length">
                <template v-for="(row, rowIdx) in actionRows" :key="`flow-row-${rowIdx}`">
                  <div class="workflow-chip-row" :class="{ reverse: rowIdx % 2 === 1 }">
                    <template v-for="(node, i) in row" :key="node.id">
                      <button
                        type="button"
                        class="workflow-chip"
                        :class="[{ selected: detailNode?.id === node.id }, `status-${node.status}`]"
                        :data-type="node.type"
                        :title="`${node.label} · ${brief(node.tool || node.detail)}`"
                        @click="selectNode(node)"
                      >
                        <ActionIcon :type="node.type" :size="20" :prefix="node.id" />
                      </button>
                      <span v-if="i < row.length - 1" class="workflow-chip-connector" aria-hidden="true"></span>
                    </template>
                  </div>
                  <div
                    v-if="rowIdx < actionRows.length - 1"
                    class="workflow-chip-uturn"
                    :class="rowIdx % 2 === 1 ? 'is-left' : 'is-right'"
                    aria-hidden="true"
                  ></div>
                </template>
              </template>
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
