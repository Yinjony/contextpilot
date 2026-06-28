<script setup>
import {ref, computed, watch} from 'vue'
import SessionSidebar from './components/SessionSidebar.vue'
import ContextWorkbench from './components/ContextWorkbench.vue'
import ChatPanel from './components/ChatPanel.vue'
import { sessions, totalSessions, contextCards } from './data/workspace.js'
import { chatModelLabel, sendChatMessage } from './model/chatAdapter.js'

// 当前活动会话（驱动聊天区标题与消息）
const chatSessions = ref(
  sessions.map((session) => ({
    ...session,
    messages: session.messages.map((message) => ({ ...message })),
  })),
)
const activeSessionId = ref(sessions[0]?.id)
const activeSession = computed(
  () => chatSessions.value.find((s) => s.id === activeSessionId.value) ?? chatSessions.value[0],
)

const isChartSession = computed(() => activeSession.value?.id === 'chart')

watch(
  () => activeSession.value?.id,
  (newId) => {
    if (newId === 'chart') {
      console.log('Entering chart performance test mode')
    }
  }
)
const isSending = ref(false)
const chatError = ref('')

// 两侧栏收起状态
const sidebarCollapsed = ref(false)
const contextCollapsed = ref(false)

function selectSession(id) {
  activeSessionId.value = id
  chatError.value = ''
}

async function handleSendMessage(text) {
  const content = text.trim()
  const session = activeSession.value
  if (!content || !session || isSending.value) return

  chatError.value = ''
  const userMessage = createMessage('user', content)
  const assistantMessage = createMessage('assistant', '正在连接模型并生成回复...', {
    pending: true,
  })

  session.messages.push(userMessage, assistantMessage)
  isSending.value = true

  try {
    const reply = await sendChatMessage({
      sessionId: session.id,
      title: session.title,
      messages: session.messages,
    })
    assistantMessage.text = reply
  } catch (error) {
    const message = error instanceof Error ? error.message : '模型调用失败。'
    assistantMessage.text = message
    assistantMessage.error = true
    chatError.value = message
  } finally {
    assistantMessage.pending = false
    isSending.value = false
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

function currentTime() {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date())
}
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
      @select="selectSession"
      @collapse="sidebarCollapsed = true"
      @expand="sidebarCollapsed = false"
    />

    <ContextWorkbench
      :cards="contextCards"
      :collapsed="contextCollapsed"
      @collapse="contextCollapsed = true"
      @expand="contextCollapsed = false"
    />

    <ChatPanel
      :title="activeSession.title"
      :messages="activeSession.messages"
      :is-sending="isSending"
      :error="chatError"
      :model-label="chatModelLabel"
      v-if="!isChartSession"
      @send="handleSendMessage"
    />

    <ChatPanel
      v-if="isChartSession"
      :title="activeSession.title"
      :messages="activeSession.messages"
      :is-sending="isSending"
      :error="chatError"
      :model-label="chatModelLabel"
      @send="handleSendMessage"
    />
  </main>
</template>
