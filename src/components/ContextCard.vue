<script setup>
defineProps({
  card: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <article class="context-card" :class="{ muted: card.state === '隐藏' }">
    <div class="card-topline">
      <span class="source-pill">{{ card.source }}</span>
      <span class="state-pill">{{ card.state }}</span>
    </div>
    <h3>{{ card.title }}</h3>
    <p>{{ card.body }}</p>
    <footer>
      <span>{{ card.type }} · {{ card.time }}</span>
      <strong class="priority" :data-priority="card.priority">{{ card.priority }}优先级</strong>
    </footer>
  </article>
</template>
