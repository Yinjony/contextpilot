<script setup>
import AppIcon from './AppIcon.vue'
import ContextCard from './ContextCard.vue'

defineProps({
  metrics: { type: Array, required: true },
  filters: { type: Array, required: true },
  cards: { type: Array, required: true },
})
</script>

<template>
  <section class="context-panel" aria-label="上下文工作台">
    <header class="panel-header">
      <div>
        <p class="eyebrow">上下文已应用</p>
        <h2>可控上下文工作台</h2>
      </div>
      <button type="button" class="ghost-button">
        <AppIcon name="eye" :size="15" />
        <span>预览</span>
      </button>
    </header>

    <div class="metric-grid" aria-label="上下文统计">
      <div
        v-for="m in metrics"
        :key="m.label"
        class="metric"
        :data-tone="m.tone"
      >
        <span class="metric-ico"><AppIcon :name="m.icon" :size="18" /></span>
        <div class="metric-body">
          <span class="metric-value">{{ m.value }}<small v-if="m.unit">{{ m.unit }}</small></span>
          <span class="metric-label">{{ m.label }}</span>
        </div>
      </div>
    </div>

    <div class="filter-bar" aria-label="上下文类型筛选">
      <button
        v-for="filter in filters"
        :key="filter.label"
        type="button"
        :class="{ active: filter.active }"
      >
        {{ filter.label }}
        <span class="count">{{ filter.count }}</span>
      </button>
    </div>

    <label class="search-box">
      <span class="search-ico"><AppIcon name="search" :size="16" /></span>
      <span class="sr-only">搜索上下文片段</span>
      <input type="search" placeholder="搜索上下文片段..." />
      <kbd>Q</kbd>
    </label>

    <div class="context-toolbar">
      <button type="button" class="with-icon"><AppIcon name="filter" :size="14" />筛选</button>
      <button type="button">隐藏过期</button>
      <button type="button">按优先级</button>
    </div>

    <div class="context-list">
      <ContextCard v-for="card in cards" :key="card.id" :card="card" />
    </div>
  </section>
</template>
