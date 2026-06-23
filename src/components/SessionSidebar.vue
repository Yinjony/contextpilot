<script setup>
import AppIcon from './AppIcon.vue'

defineProps({
  project: { type: Object, required: true },
  sessions: { type: Array, required: true },
  totalSessions: { type: Number, default: 0 },
})
</script>

<template>
  <aside class="sidebar" aria-label="会话导航">
    <div class="sidebar-header">
      <div class="brand-mark">CP</div>
      <div>
        <p class="eyebrow">CONTEXTPILOT</p>
        <h1>上下文操作台</h1>
      </div>
    </div>

    <section class="project-card" aria-label="当前任务">
      <p class="label">当前任务</p>
      <h2>{{ project.title }}</h2>
      <div class="progress-row">
        <span class="status-chip"><i class="dot pulse"></i>{{ project.status }}</span>
        <strong>{{ project.updatedAt }}</strong>
      </div>
    </section>

    <nav class="quick-actions" aria-label="快捷操作">
      <button type="button">
        <span class="qa-ico"><AppIcon name="refresh" :size="16" /></span>
        <span class="qa-label">刷新上下文</span>
        <kbd>E</kbd>
      </button>
      <button type="button">
        <span class="qa-ico"><AppIcon name="sliders" :size="16" /></span>
        <span class="qa-label">设置</span>
        <kbd>K</kbd>
      </button>
      <button type="button" class="primary-action">
        <AppIcon name="plus" :size="16" />
        <span>新建会话</span>
      </button>
    </nav>

    <section class="session-list" aria-label="会话列表">
      <div class="section-heading">
        <span>会话</span>
        <strong>{{ totalSessions }}</strong>
      </div>
      <button
        v-for="session in sessions"
        :key="session.id"
        type="button"
        class="session-item"
        :class="{ active: session.active }"
      >
        <span class="session-status" :data-tone="session.tone"><i class="dot"></i>{{ session.status }}</span>
        <strong>{{ session.title }}</strong>
        <small>{{ session.summary }}</small>
        <em>{{ session.time }}</em>
      </button>
    </section>

    <button type="button" class="all-sessions">
      <span>查看全部会话 ({{ totalSessions }})</span>
      <AppIcon name="arrow-right" :size="16" />
    </button>
  </aside>
</template>
