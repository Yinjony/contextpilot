<script setup>
import { ref, computed, watch } from 'vue'
import AppIcon from './AppIcon.vue'
import ContextCard from './ContextCard.vue'

const props = defineProps({
  cards: { type: Array, required: true },
  collapsed: { type: Boolean, default: false },
  isSummarizing: { type: Boolean, default: false },
})

defineEmits(['collapse', 'expand', 'update-priority', 'toggle', 'delete-card'])

// 类型筛选：按 category 动态生成，计数对应实际卡片；点击可过滤列表
const activeFilter = ref('All')
// 关键词搜索：匹配 title/body/category/topic，与类型筛选叠加生效；空值不过滤。
const searchQuery = ref('')
const filterBarRef = ref(null)
const isFilterDragging = ref(false)
const filterDragMoved = ref(false)
let filterDragStartX = 0
let filterDragStartScrollLeft = 0
let filterPointerLabel = ''
const categoryLabelMap = new Map([
  ['问题分析', 'Issue Analysis'],
  ['修复方案', 'Fix Plan'],
  ['关键报错', 'Key Error'],
  ['旧假设', 'Old Assumption'],
  ['实验设计', 'Study Design'],
  ['论文调研', 'Literature Review'],
  ['方案设计', 'Solution Design'],
  ['产品方案探索', 'Product Design'],
  ['文档总结', 'Document Summary'],
  ['进展', 'Progress'],
])
const displayCategory = (category) => categoryLabelMap.get(category) || category

const filters = computed(() => {
  const visibleCards = props.cards.filter((card) => !card.deleted)
  const categories = [...new Set(visibleCards.map((c) => c.category))]
  return [
    { label: 'All', count: visibleCards.length, active: activeFilter.value === 'All' },
    ...categories.map((cat) => ({
      label: displayCategory(cat),
      value: cat,
      count: visibleCards.filter((c) => c.category === cat).length,
      active: activeFilter.value === cat,
    })),
  ]
})
const filteredCards = computed(() => {
  const visibleCards = props.cards.filter((card) => !card.deleted)
  let list = activeFilter.value === 'All'
    ? visibleCards
    : visibleCards.filter((c) => c.category === activeFilter.value)

  const query = searchQuery.value.trim().toLowerCase()
  if (query) {
    list = list.filter((card) =>
      [card.title, card.body, card.category, card.topic].some(
        (value) => typeof value === 'string' && value.toLowerCase().includes(query),
      ),
    )
  }
  return list
})

function clearSearch() {
  searchQuery.value = ''
}

// 当前筛选分类被清空时回退到「全部」。
watch(
  () => props.cards.map((card) => card.category).join('|'),
  () => {
    if (
      activeFilter.value !== 'All' &&
      !props.cards.some((c) => !c.deleted && c.category === activeFilter.value)
    ) {
      activeFilter.value = 'All'
    }
  },
)

function selectFilter(label) {
  if (filterDragMoved.value) return
  activeFilter.value = label === 'All' ? 'All' : label
}

function filterLabelFromEvent(event) {
  return event.target?.closest?.('[data-filter-label]')?.dataset.filterLabel || ''
}

function handleFilterWheel(event) {
  const el = filterBarRef.value
  if (!el || el.scrollWidth <= el.clientWidth) return

  const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY
  if (!delta) return

  event.preventDefault()
  el.scrollLeft += delta
}

function startFilterDrag(event) {
  if (event.button !== undefined && event.button !== 0) return

  const el = filterBarRef.value
  if (!el || el.scrollWidth <= el.clientWidth) return

  isFilterDragging.value = true
  filterDragMoved.value = false
  filterPointerLabel = filterLabelFromEvent(event)
  filterDragStartX = event.clientX
  filterDragStartScrollLeft = el.scrollLeft
}

function moveFilterDrag(event) {
  const el = filterBarRef.value
  if (!isFilterDragging.value || !el) return

  const offset = event.clientX - filterDragStartX
  if (Math.abs(offset) > 4) filterDragMoved.value = true
  el.scrollLeft = filterDragStartScrollLeft - offset
}

function endFilterDrag() {
  if (!isFilterDragging.value) return

  isFilterDragging.value = false
  window.setTimeout(() => {
    filterDragMoved.value = false
    filterPointerLabel = ''
  }, 0)
}

function handleFilterPointerUp() {
  const label = filterPointerLabel
  const wasDragging = filterDragMoved.value
  endFilterDrag()
  if (!wasDragging && label) {
    activeFilter.value = label
  }
}

// 顶部指标随选择状态联动：总片段数 = 已选中 + 隐藏（基于全部片段）
const metrics = computed(() => {
  const visibleCards = props.cards.filter((card) => !card.deleted)
  const total = visibleCards.length
  const selected = visibleCards.filter((c) => c.selected).length
  return [
    { label: 'Total Cards', value: String(total), icon: 'layers', tone: 'violet' },
    { label: 'Selected', value: String(selected), icon: 'check', tone: 'green' },
    { label: 'Hidden', value: String(total - selected), icon: 'zap', tone: 'blue' },
  ]
})
</script>

<template>
  <section class="context-panel" :class="{ collapsed }" aria-label="Context workbench">
    <!-- 收起态：窄轨，仅留图标 + 展开按钮 -->
    <button
      v-if="collapsed"
      type="button"
      class="rail-toggle"
      aria-label="Expand context panel"
      @click="$emit('expand')"
    >
      <span class="rail-content-icon"><AppIcon name="layers" :size="18" /></span>
      <AppIcon name="chevrons-right" :size="18" />
    </button>

    <template v-else>
      <header class="panel-header">
        <div>
          <h2>Context Workbench</h2>
        </div>
        <button
          type="button"
          class="icon-btn"
          aria-label="Collapse context panel"
          @click="$emit('collapse')"
        >
          <AppIcon name="chevrons-left" :size="16" />
        </button>
      </header>

    <div class="metric-grid" aria-label="Context statistics">
      <div
        v-for="m in metrics"
        :key="m.label"
        class="metric"
        :data-tone="m.tone"
      >
        <span class="metric-ico"><AppIcon :name="m.icon" :size="14" /></span>
        <div class="metric-body">
          <span class="metric-value">{{ m.value }}<small v-if="m.unit">{{ m.unit }}</small></span>
          <span class="metric-label">{{ m.label }}</span>
        </div>
      </div>
    </div>

    <div
      ref="filterBarRef"
      class="filter-bar"
      :class="{ dragging: isFilterDragging }"
      aria-label="Context category filters; scroll horizontally"
      tabindex="0"
      @wheel="handleFilterWheel"
      @pointerdown="startFilterDrag"
      @pointermove="moveFilterDrag"
      @pointerup="handleFilterPointerUp"
      @pointercancel="endFilterDrag"
      @pointerleave="endFilterDrag"
    >
      <button
        v-for="filter in filters"
        :key="filter.value || filter.label"
        type="button"
        :class="{ active: filter.active }"
        :data-filter-label="filter.value || filter.label"
        @click="selectFilter(filter.value || filter.label)"
      >
        {{ filter.label }}
        <span class="count">{{ filter.count }}</span>
      </button>
    </div>

    <div class="search-row">
      <label class="search-box">
        <span class="search-ico"><AppIcon name="search" :size="16" /></span>
        <span class="sr-only">Search context cards</span>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search context cards..."
          aria-label="Search context cards"
        />
        <button
          v-if="searchQuery"
          type="button"
          class="search-clear"
          aria-label="Clear search"
          @click="clearSearch"
        >
          <AppIcon name="x" :size="14" />
        </button>
      </label>

      <div class="context-toolbar">
        <button type="button" class="with-icon"><AppIcon name="filter" :size="14" />Filter</button>
      </div>
    </div>

    <div v-if="isSummarizing" class="context-status" aria-live="polite">
      <span class="status-dot pulse"></span>
      The supervisor is summarizing this turn…
    </div>

    <div v-if="filteredCards.length" class="context-list">
      <ContextCard
        v-for="card in filteredCards"
        :key="card.id"
        :card="card"
        :selected="card.selected"
        @toggle="$emit('toggle', card.id)"
        @delete="$emit('delete-card', card.id)"
        @update-priority="$emit('update-priority', $event)"
      />
    </div>
    <div v-else-if="!isSummarizing" class="context-empty" aria-live="polite">
      <span class="empty-icon"><AppIcon name="layers" :size="22" /></span>
      <h3>{{ searchQuery ? 'No matching context cards' : 'No context cards yet' }}</h3>
      <p v-if="searchQuery">Try another keyword, or <span class="context-empty-action" role="button" tabindex="0" @click="clearSearch" @keydown.enter="clearSearch">clear search</span>.</p>
      <p v-else>After the first message, <br>
        the supervisor will summarize the turn into cards.</p>
    </div>
    </template>
  </section>
</template>
