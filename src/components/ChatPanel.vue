<script setup>
import AppIcon from './AppIcon.vue'
import ChatMessage from './ChatMessage.vue'

defineProps({
  appliedContext: { type: Array, required: true },
  messages: { type: Array, required: true },
})
</script>

<template>
  <section class="chat-panel" aria-label="AI 对话窗口">
    <header class="chat-header">
      <div>
        <p class="eyebrow">AI 对话窗口</p>
        <h2>登录接口错误原因分析与修复建议</h2>
      </div>
      <span class="model-chip"><i class="dot pulse"></i>opencode ready</span>
    </header>

    <div class="applied-strip">
      <span class="strip-label">本轮参考上下文</span>
      <button v-for="item in appliedContext" :key="item" type="button">{{ item }}</button>
    </div>

    <div class="messages">
      <ChatMessage v-for="message in messages" :key="message.id" :message="message" />
    </div>

    <form class="composer" aria-label="发送消息" @submit.prevent>
      <input type="text" value="重新运行认证测试，并只保留有效上下文" />
      <button type="submit">
        <AppIcon name="send" :size="16" />
        <span>发送</span>
      </button>
    </form>
  </section>
</template>
