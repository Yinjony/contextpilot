<script setup>
import { computed } from 'vue'
import { getActionIconSvg, prefixSvgIds } from './actionIcons.js'

const props = defineProps({
  type: { type: String, required: true },
  size: { type: [Number, String], default: 18 },
  // 同一动作类型在一页内多次出现时，给 SVG 内部 id 加唯一前缀，
  // 避免 mask 引用错位 / 重复 id 警告；缺省用 type 作为前缀。
  prefix: { type: String, default: '' },
})

// node.id 这类值可能含冒号等字符，转成合法的 id 片段
function sanitizePrefix(p) {
  return String(p || '').replace(/[^a-zA-Z0-9_-]/g, '-')
}

const sizeStyle = computed(() => {
  const v = typeof props.size === 'number' ? `${props.size}px` : props.size
  return { width: v, height: v }
})

const svg = computed(() => {
  const pfx = sanitizePrefix(props.prefix || props.type)
  return pfx ? prefixSvgIds(getActionIconSvg(props.type), pfx) : getActionIconSvg(props.type)
})
</script>

<template>
  <!-- 颜色由外层 color 透传（图标内部用 currentColor），尺寸由 size 控制 -->
  <span class="action-icon" :style="sizeStyle" aria-hidden="true" v-html="svg" />
</template>
