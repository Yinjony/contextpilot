<script setup>
import AppIcon from './AppIcon.vue'

defineProps({
  card: { type: Object, required: true },
  selected: { type: Boolean, default: false },
})

defineEmits(['toggle'])
</script>

<template>
  <article class="context-card" :class="{ selected }">
    <div class="card-topline">
      <span class="category-pill" :data-category="card.category">{{ card.category }}</span>
      <label
        class="card-check"
        :class="{ checked: selected }"
        :title="selected ? '取消选择该片段' : '选择该片段'"
      >
        <input type="checkbox" :checked="selected" @change="$emit('toggle')" />
        <AppIcon name="check" :size="13" />
      </label>
    </div>
    <h3>{{ card.title }}</h3>
    <p>{{ card.body }}</p>
    <footer>
      <span>{{ card.time }}</span>
      <strong class="priority" :data-priority="card.priority">{{ card.priority }}优先级</strong>
    </footer>
  </article>
</template>
