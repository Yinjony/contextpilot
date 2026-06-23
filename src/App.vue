<script setup>
import SessionSidebar from './components/SessionSidebar.vue'
import ContextWorkbench from './components/ContextWorkbench.vue'
import ChatPanel from './components/ChatPanel.vue'
import {
  currentProject,
  sessions,
  totalSessions,
  metrics,
  filters,
  contextCards,
  appliedContext,
  chatMessages,
} from './data/workspace.js'
</script>

<template>
  <main class="app-shell" aria-label="ContextPilot workspace">
    <SessionSidebar
      :project="currentProject"
      :sessions="sessions"
      :total-sessions="totalSessions"
    />
    <ContextWorkbench :metrics="metrics" :filters="filters" :cards="contextCards" />
    <ChatPanel :applied-context="appliedContext" :messages="chatMessages" />
  </main>
</template>
