<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import AppIcon from './AppIcon.vue'

const props = defineProps({
  sessionTitle: { type: String, default: '当前对话' },
  messages: { type: Array, default: () => [] },
  cards: { type: Array, default: () => [] },
  isSummarizing: { type: Boolean, default: false },
})

defineEmits(['close'])

const modalRef = ref(null)
const actionFilter = ref('all')
const selectedNode = ref(null)

const typeMeta = {
  UserRequest: { label: '用户请求', short: '用', group: 'model' },
  Think: { label: '模型思考', short: '思', group: 'model' },
  Response: { label: '生成回复', short: '答', group: 'model' },
  Read: { label: '读取', short: '读', group: 'tool' },
  Write: { label: '写入', short: '写', group: 'tool' },
  Shell: { label: '命令', short: '终', group: 'tool' },
  Search: { label: '搜索', short: '搜', group: 'tool' },
  Plan: { label: '计划', short: '计', group: 'tool' },
  Subagent: { label: '子代理', short: '代', group: 'tool' },
  Skill: { label: '技能', short: '技', group: 'tool' },
  Compaction: { label: '上下文压缩', short: '压', group: 'model' },
  Tool: { label: '工具调用', short: '工', group: 'tool' },
  Context: { label: '上下文卡片', short: '卡', group: 'context' },
  Supervisor: { label: '监督总结', short: '监', group: 'supervisor' },
  Persist: { label: '卡片写回', short: '存', group: 'supervisor' },
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
    short: meta.short,
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

const contextNodes = computed(() =>
  props.cards.slice(0, 10).map((card, index) => ({
    id: `context:${card.id || index}`,
    type: 'Context',
    label: card.title || '未命名卡片',
    short: '卡',
    group: 'context',
    status: card.selected ? 'included' : 'excluded',
    detail: card.body || '暂无卡片内容',
    time: card.time || '未知时间',
    partIDs: Array.isArray(card.partIDs) ? card.partIDs : [],
    priority: card.priority || '中',
    category: card.category || '未分类',
  })),
)

const selectedCards = computed(() => props.cards.filter((card) => card.selected))
const selectedPartIDs = computed(() => [
  ...new Set(selectedCards.value.flatMap((card) => Array.isArray(card.partIDs) ? card.partIDs : [])),
])
const relatedPartIDs = computed(() => [
  ...new Set(props.cards.flatMap((card) => Array.isArray(card.partIDs) ? card.partIDs : [])),
])

const supervisorNodes = computed(() => {
  const hasAssistant = props.messages.some((message) => message.role === 'assistant')
  return [
    {
      id: 'supervisor:summary',
      type: 'Supervisor',
      label: props.isSummarizing ? '正在总结本轮' : '监督总结',
      short: '监',
      group: 'supervisor',
      status: props.isSummarizing ? 'running' : hasAssistant ? 'completed' : 'pending',
      detail: '主对话进入空闲后，监督会话提取稳定事实，并要求只关联真实存在的 source partID。',
      time: props.isSummarizing ? '进行中' : '空闲后触发',
    },
    {
      id: 'supervisor:persist',
      type: 'Persist',
      label: `写回 ${props.cards.length} 张卡片`,
      short: '存',
      group: 'supervisor',
      status: props.isSummarizing ? 'running' : props.cards.length ? 'completed' : 'pending',
      detail: '监督结果按主题合并并持久化；已有卡片会保留选择状态、优先级和历史 part 关联。',
      time: '总结完成后',
    },
  ]
})

const metrics = computed(() => [
  { label: '动作', value: conversationActions.value.length },
  { label: '模型轮次', value: props.messages.filter((message) => message.role === 'user').length },
  { label: '已选卡片', value: `${selectedCards.value.length}/${props.cards.length}` },
  { label: '注入 part', value: selectedPartIDs.value.length },
])

const detailNode = computed(() => selectedNode.value || filteredActions.value.at(-1) || supervisorNodes.value[0])

function selectNode(node) {
  selectedNode.value = node
}

function statusText(status) {
  return {
    completed: '已完成', running: '进行中', pending: '待触发', error: '失败',
    included: '下一轮可见', excluded: '下一轮隔离',
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
            <h2 id="workflow-title">工作流查看</h2>
            <span>{{ sessionTitle }}</span>
          </div>
          <p>把 OpenCode 消息 part 映射成标准动作，并同时显化卡片选择对下一轮上下文的影响。</p>
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
          <span><i class="excluded"></i>已隔离</span>
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
                        <span class="workflow-chip-glyph">{{ node.short }}</span>
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

          <section class="workflow-lane context-lane">
            <div class="workflow-lane-label">
              <strong>上下文选择</strong>
              <span>决定下一轮可见 part</span>
            </div>
            <div v-if="contextNodes.length" class="workflow-context-grid">
              <button
                v-for="node in contextNodes"
                :key="node.id"
                type="button"
                class="workflow-context-node"
                :class="[{ selected: detailNode?.id === node.id }, `status-${node.status}`]"
                @click="selectNode(node)"
              >
                <span class="workflow-node-icon">{{ node.short }}</span>
                <span>
                  <strong>{{ brief(node.label, 18) }}</strong>
                  <small>{{ node.partIDs.length }} 个 part · {{ statusText(node.status) }}</small>
                </span>
              </button>
              <div class="workflow-context-gate">
                <AppIcon name="arrow-right" :size="16" />
                <span><strong>{{ selectedPartIDs.length }}</strong> 个关联 part 注入下一轮</span>
              </div>
            </div>
            <div v-else class="workflow-lane-empty">尚无总结卡片；完成一轮对话后由监督流程生成</div>
          </section>

          <section class="workflow-lane supervisor-lane">
            <div class="workflow-lane-label">
              <strong>监督流程</strong>
              <span>主会话 idle 后运行</span>
            </div>
            <div class="workflow-track">
              <template v-for="(node, index) in supervisorNodes" :key="node.id">
                <button
                  type="button"
                  class="workflow-node"
                  :class="[{ selected: detailNode?.id === node.id }, `status-${node.status}`]"
                  :data-type="node.type"
                  @click="selectNode(node)"
                >
                  <span class="workflow-node-icon">{{ node.short }}</span>
                  <span class="workflow-node-copy">
                    <strong>{{ node.label }}</strong>
                    <small>{{ statusText(node.status) }}</small>
                  </span>
                  <em>{{ node.time }}</em>
                </button>
                <span v-if="index < supervisorNodes.length - 1" class="workflow-connector" aria-hidden="true"></span>
              </template>
            </div>
          </section>
        </div>

        <aside v-if="detailNode" class="workflow-detail" aria-live="polite">
          <div class="workflow-detail-heading">
            <span class="workflow-node-icon" :data-type="detailNode.type">{{ detailNode.short }}</span>
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
          <div v-if="detailNode.status === 'excluded'" class="workflow-detail-note">
            此卡片未被选择，它关联的 part 不会进入模型下一轮上下文。
          </div>
        </aside>
      </div>

      <footer class="workflow-footer">
        <p>共关联 {{ relatedPartIDs.length }} 个历史 part；当前实际注入 {{ selectedPartIDs.length }} 个。</p>
        <button type="button" class="secondary-action" @click="$emit('close')">关闭</button>
      </footer>
    </section>
  </div>
</template>
