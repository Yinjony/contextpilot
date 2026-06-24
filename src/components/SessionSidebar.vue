<script setup>
import AppIcon from './AppIcon.vue'

defineProps({
  sessions: { type: Array, required: true },
  activeId: { type: String, default: '' },
  collapsed: { type: Boolean, default: false },
})

defineEmits(['select', 'collapse', 'expand'])
</script>

<template>
  <aside class="sidebar" :class="{ collapsed }" aria-label="会话导航">
    <!-- 收起态：窄轨，仅留品牌标 + 展开按钮 -->
    <button
      v-if="collapsed"
      type="button"
      class="rail-toggle"
      aria-label="展开会话栏"
      @click="$emit('expand')"
    >
      <span class="brand-mark mini">CP</span>
      <AppIcon name="chevrons-right" :size="18" />
    </button>

    <template v-else>
      <div class="sidebar-header">
        <div class="brand-mark">CP</div>
        <div class="sidebar-title">
          <p class="eyebrow">CONTEXTPILOT</p>
          <h1>上下文操作台</h1>
        </div>
        <button
          type="button"
          class="icon-btn"
          aria-label="收起会话栏"
          @click="$emit('collapse')"
        >
          <AppIcon name="chevrons-left" :size="16" />
        </button>
      </div>

      <nav class="quick-actions" aria-label="快捷操作">
        <button type="button" class="primary-action">
          <AppIcon name="plus" :size="16" />
          <span>新建会话</span>
        </button>
      </nav>

      <section class="session-list" aria-label="会话列表">
        <div class="section-heading">
          <span>会话</span>
          <strong>{{ sessions.length }}</strong>
        </div>
        <button
          v-for="session in sessions"
          :key="session.id"
          type="button"
          class="session-item"
          :class="{ active: session.id === activeId }"
          @click="$emit('select', session.id)"
        >
          <strong>{{ session.title }}</strong>
          <em>{{ session.time }}</em>
        </button>
      </section>

      <button type="button" class="all-sessions">
        <span>查看全部会话 ({{ sessions.length }})</span>
        <AppIcon name="arrow-right" :size="16" />
      </button>
    </template>
  </aside>
</template>
