<script setup>
import { computed, ref } from 'vue'
import AppIcon from './AppIcon.vue'

const props = defineProps({
  card: { type: Object, required: true },
  selected: { type: Boolean, default: false },
})

defineEmits(['toggle', 'update-priority'])

const expanded = ref(false)
const descriptionId = computed(() => `context-card-description-${props.card.id}`)
const normalizedBody = computed(() => String(props.card.body || '').replace(/\s+/g, ' ').trim())
const linkedCount = computed(() => {
  const count = Array.isArray(props.card.partIDs) ? props.card.partIDs.length : 0
  return count ? `${count} 个片段` : '1 个主题'
})
const sourceLabel = computed(() => props.card.source || '对话')
const bodySize = computed(() => `约 ${normalizedBody.value.length} 字`)
</script>

<template>
  <article class="context-card" :class="{ selected, expanded }">
    <div class="card-topline">
      <span class="category-pill" :data-category="card.category">{{ card.category }}</span>
      <div class="card-actions">
        <label
          class="card-check"
          :class="{ checked: selected }"
          :title="selected ? '取消选择该片段' : '选择该片段'"
        >
          <input type="checkbox" :checked="selected" @change="$emit('toggle')" />
          <AppIcon name="check" :size="13" />
        </label>
      </div>
    </div>
    <h3>{{ card.title }}</h3>
    <p :id="descriptionId" class="card-description">{{ normalizedBody }}</p>

    <div class="card-footer">
      <div class="card-metadata" aria-label="上下文片段信息">
        <span><AppIcon name="file-text" :size="15" />{{ sourceLabel }}</span>
        <i aria-hidden="true">·</i>
        <span><AppIcon name="bookmark" :size="15" />{{ linkedCount }}</span>
        <i aria-hidden="true">·</i>
        <span><b aria-hidden="true">T</b>{{ bodySize }}</span>
      </div>
      <button
        type="button"
        class="card-expand"
        :aria-expanded="expanded"
        :aria-controls="descriptionId"
        @click="expanded = !expanded"
      >
        {{ expanded ? '收起预览' : '展开预览' }}
        <AppIcon name="chevron-down" :size="15" />
      </button>
    </div>
  </article>
</template>
