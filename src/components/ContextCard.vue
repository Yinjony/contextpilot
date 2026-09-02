<script setup>
import { computed, ref } from 'vue'
import AppIcon from './AppIcon.vue'

const props = defineProps({
  card: { type: Object, required: true },
  selected: { type: Boolean, default: false },
})

defineEmits(['toggle', 'delete', 'update-priority'])

const expanded = ref(false)
const descriptionId = computed(() => `context-card-description-${props.card.id}`)
const normalizedBody = computed(() => String(props.card.body || '').replace(/\s+/g, ' ').trim())
const items = computed(() => Array.isArray(props.card.items) ? props.card.items : [])
const currentItems = computed(() => items.value.filter((item) =>
  ['active', 'pending', 'conflict'].includes(item.validity),
))
const linkedCount = computed(() => {
  const count = Array.isArray(props.card.partIDs) ? props.card.partIDs.length : 0
  return count ? `${count} parts` : '1 topic'
})
const sourceLabel = computed(() => props.card.source || 'Chat')
const bodySize = computed(() => `~${normalizedBody.value.length} chars`)
const labelMap = new Map([
  ['问题分析', 'Issue Analysis'],
  ['修复方案', 'Fix Plan'],
  ['关键报错', 'Key Error'],
  ['旧假设', 'Old Assumption'],
  ['实验设计', 'Study Design'],
  ['论文调研', 'Literature Review'],
  ['方案设计', 'Solution Design'],
  ['产品方案探索', 'Product Design'],
  ['文档总结', 'Document Summary'],
  ['进展', 'Progress'],
  ['对话', 'Chat'],
  ['文件', 'File'],
  ['工具', 'Tool'],
])
const displayCategory = computed(() => labelMap.get(props.card.category) || props.card.category)
const displaySource = computed(() => labelMap.get(sourceLabel.value) || sourceLabel.value)
</script>

<template>
  <article class="context-card" :class="{ selected, expanded }">
    <div class="card-topline">
      <span class="category-pill" :data-category="displayCategory">{{ displayCategory }}</span>
      <div class="card-actions">
        <button
          type="button"
          class="card-delete"
          title="Delete card"
          aria-label="Delete card"
          @click="$emit('delete')"
        >
          <AppIcon name="trash" :size="13" />
        </button>
        <label
          class="card-check"
          :class="{ checked: selected }"
          :title="selected ? 'Remove from context' : 'Add to context'"
        >
          <input type="checkbox" :checked="selected" @change="$emit('toggle')" />
          <AppIcon name="check" :size="13" />
        </label>
      </div>
    </div>
    <h3>{{ card.title }}</h3>
    <p v-if="!expanded" :id="descriptionId" class="card-description">{{ normalizedBody }}</p>

    <ul v-else-if="currentItems.length" :id="descriptionId" class="card-detail-list">
      <li v-for="item in currentItems" :key="item.id">
        <span class="card-detail-marker" aria-hidden="true"></span>
        <div class="card-detail-copy">
          <strong v-if="item.attribute">{{ item.attribute }}</strong>
          <span>{{ item.value }}</span>
          <em v-if="item.validity !== 'active'" :data-validity="item.validity">
            {{ item.validity === 'pending' ? 'Pending' : 'Conflict' }}
          </em>
        </div>
      </li>
    </ul>

    <p v-else :id="descriptionId" class="card-description card-description-full">{{ normalizedBody }}</p>

    <div class="card-footer">
      <div class="card-metadata" aria-label="Context card metadata">
        <span><AppIcon name="file-text" :size="15" />{{ displaySource }}</span>
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
        {{ expanded ? 'Collapse Preview' : 'Expand Preview' }}
        <AppIcon name="chevron-down" :size="15" />
      </button>
    </div>
  </article>
</template>
