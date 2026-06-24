<script setup>
import AppIcon from './AppIcon.vue'

defineProps({
  message: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <article class="message" :class="message.role">
    <div class="avatar">
      <template v-if="message.role === 'user'">你</template>
      <AppIcon v-else name="sparkles" :size="18" />
    </div>
    <div class="bubble" :class="{ pending: message.pending, error: message.error }">
      <span class="bubble-meta">{{ message.role === 'user' ? '你' : 'AI' }} · {{ message.time }}</span>
      <h3 v-if="message.heading">{{ message.heading }}</h3>
      <p>{{ message.text }}</p>

      <div v-if="message.codeBlock" class="fix-block">
        <div class="fix-head">
          <span class="fix-dots"><i></i><i></i><i></i></span>
          <code class="fix-file">{{ message.codeBlock.file }}</code>
          <span class="fix-lang">{{ message.codeBlock.language }}</span>
        </div>
        <pre><code>{{ message.codeBlock.code }}</code></pre>
      </div>
    </div>
  </article>
</template>
