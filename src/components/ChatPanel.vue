<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import AppIcon from './AppIcon.vue'
import ChatMessage from './ChatMessage.vue'
import { createDefaultChatConfig, normalizeChatConfig } from '../model/chatAdapter.js'

const props = defineProps({
  title: { type: String, default: 'AI 对话窗口' },
  messages: { type: Array, required: true },
  isSending: { type: Boolean, default: false },
  error: { type: String, default: '' },
  modelLabel: { type: String, default: 'opencode' },
  chatConfig: { type: Object, default: () => createDefaultChatConfig() },
  projectDirectory: { type: String, default: '' },
})

const emit = defineEmits(['send', 'stop', 'update-config'])
const draft = ref('')
const messagesEl = ref(null)
const fileInput = ref(null)
const imageInput = ref(null)
const attachments = ref([])
const attachmentError = ref('')
const canSend = computed(() => (draft.value.trim().length > 0 || attachments.value.length > 0) && !props.isSending)
const inlineConfig = ref(createDefaultChatConfig())
const rulesMenuOpen = ref(false)
const stageMenuOpen = ref(false)
const newRule = ref('')

const stages = ['需求澄清', '方案设计', '实现与调试', '测试与验证', '交付与复盘']
const tools = [
  { key: 'readFiles', label: '读取文件', icon: 'layers', desc: '允许读取项目内的文件内容' },
  { key: 'runTests', label: '运行测试', icon: 'check', desc: '允许执行测试与构建命令' },
  { key: 'writeFiles', label: '写入文件', icon: 'pencil', desc: '允许新建或修改项目文件' },
  { key: 'network', label: '联网', icon: 'share', desc: '允许访问网络与外部接口' },
]

watch(
  () => props.chatConfig,
  (config) => {
    inlineConfig.value = normalizeChatConfig(config)
  },
  { immediate: true, deep: true },
)

function emitConfig() {
  emit('update-config', normalizeChatConfig(inlineConfig.value))
}

const stageIndex = computed(() => Math.max(0, stages.indexOf(inlineConfig.value.stage)))

function chooseStage(stage) {
  inlineConfig.value.stage = stage
  stageMenuOpen.value = false
  emitConfig()
}

function addRule() {
  const rule = newRule.value.trim()
  if (!rule || inlineConfig.value.rules.includes(rule)) return
  inlineConfig.value.rules = [...inlineConfig.value.rules, rule].slice(0, 12)
  newRule.value = ''
  emitConfig()
}

function removeRule(rule) {
  inlineConfig.value.rules = inlineConfig.value.rules.filter((item) => item !== rule)
  emitConfig()
}

function toolState(key) {
  return inlineConfig.value.toolPermissions?.[key] || 'deny'
}

function toolStateLabel(key) {
  const state = toolState(key)
  return state === 'allow' ? '允许' : state === 'confirm' ? '需确认' : '关闭'
}

function toggleTool(key) {
  const current = toolState(key)
  const next = current === 'deny' ? (key === 'writeFiles' ? 'confirm' : 'allow') : 'deny'
  inlineConfig.value.toolPermissions = {
    ...inlineConfig.value.toolPermissions,
    [key]: next,
  }
  emitConfig()
}

function submitMessage() {
  if (!canSend.value) return
  emit('send', {
    text: draft.value,
    attachments: attachments.value.map((attachment) => ({ ...attachment })),
  })
  draft.value = ''
  attachments.value = []
  attachmentError.value = ''
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error(`无法读取文件：${file.name}`))
    reader.readAsDataURL(file)
  })
}

async function addAttachments(fileList, kind) {
  attachmentError.value = ''
  const incoming = [...(fileList || [])]
  if (!incoming.length) return
  if (attachments.value.length + incoming.length > 5) {
    attachmentError.value = '每条消息最多添加 5 个附件。'
    return
  }

  const next = []
  for (const file of incoming) {
    const maxSize = kind === 'image' ? 5 * 1024 * 1024 : 10 * 1024 * 1024
    if (file.size > maxSize) {
      attachmentError.value = `${file.name} 超过${kind === 'image' ? ' 5 MB' : ' 10 MB'}限制。`
      continue
    }
    if (kind === 'image' && !file.type.startsWith('image/')) {
      attachmentError.value = `${file.name} 不是支持的图片格式。`
      continue
    }
    try {
      next.push({
        id: `attachment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: file.name,
        mime: file.type || 'application/octet-stream',
        size: file.size,
        sizeLabel: formatFileSize(file.size),
        kind,
        dataUrl: await readAsDataURL(file),
      })
    } catch (cause) {
      attachmentError.value = cause?.message || String(cause)
    }
  }
  attachments.value = [...attachments.value, ...next]
}

function removeAttachment(id) {
  attachments.value = attachments.value.filter((attachment) => attachment.id !== id)
  attachmentError.value = ''
}

function selectFiles(event) {
  void addAttachments(event.target.files, 'file')
  event.target.value = ''
}

function selectImages(event) {
  void addAttachments(event.target.files, 'image')
  event.target.value = ''
}

function handlePrimaryAction() {
  if (props.isSending) {
    emit('stop')
    return
  }
  submitMessage()
}

function approveWrite() {
  if (props.isSending) return
  emit('send', {
    text: '同意写入项目。请按你上一条消息中说明的目标文件完成写入，不要再次询问路径或确认。',
    attachments: [],
    approveWrite: true,
  })
}

function rejectWrite() {
  if (props.isSending) return
  emit('send', {
    text: '暂不写入项目，请改为在对话中生成可预览和下载的 Markdown 文档。',
    attachments: [],
  })
}

watch(
  () => props.messages.length,
  async () => {
    await nextTick()
    if (messagesEl.value) {
      messagesEl.value.scrollTop = messagesEl.value.scrollHeight
    }
  },
)

// 流式时同一条消息会持续变长，监听最后一条消息的 text 即时滚到底（auto，避免 smooth 滞后）。
watch(
  () => props.messages.at(-1)?.text,
  async () => {
    await nextTick()
    if (messagesEl.value) {
      messagesEl.value.scrollTop = messagesEl.value.scrollHeight
    }
  },
)
</script>

<template>
  <section class="chat-panel" aria-label="AI 对话窗口">
    <header class="chat-header">
      <div>
        <h2>{{ title }}</h2>
      </div>
      <span class="model-chip"><span class="dot pulse"></span>{{ modelLabel }}</span>
    </header>

    <div ref="messagesEl" class="messages">
      <ChatMessage
        v-for="message in messages"
        :key="message.id"
        :message="message"
        :project-directory="projectDirectory"
        @approve-write="approveWrite"
        @reject-write="rejectWrite"
      />
    </div>

    <div class="composer-shell">
      <div class="composer-config-bar" aria-label="当前对话底盘配置">
        <div class="composer-config-stage">
          <button
            type="button"
            class="composer-config-stage-trigger"
            :class="{ open: stageMenuOpen }"
            aria-haspopup="dialog"
            :aria-expanded="stageMenuOpen"
            @click="stageMenuOpen = !stageMenuOpen"
          >
            <span class="composer-stage-badge">{{ stageIndex + 1 }}</span>
            <span class="composer-config-stage-current">{{ inlineConfig.stage }}</span>
            <AppIcon name="chevron" :size="13" />
          </button>

          <div
            v-if="stageMenuOpen"
            class="composer-stage-popover"
            role="dialog"
            aria-label="选择对话阶段"
            @keydown.esc="stageMenuOpen = false"
          >
            <div class="composer-stage-popover-header">
              <span>对话阶段</span>
              <small>第 {{ stageIndex + 1 }} / {{ stages.length }} 阶段</small>
            </div>
            <ol class="composer-stage-list">
              <li
                v-for="(stage, i) in stages"
                :key="stage"
                class="composer-stage-step"
                :class="{ active: stage === inlineConfig.stage, done: i < stageIndex }"
              >
                <button type="button" @click="chooseStage(stage)">
                  <span class="composer-stage-step-no">{{ i + 1 }}</span>
                  <span class="composer-stage-step-name">{{ stage }}</span>
                  <AppIcon
                    v-if="stage === inlineConfig.stage"
                    name="check"
                    :size="13"
                    class="composer-stage-step-mark"
                  />
                </button>
              </li>
            </ol>
          </div>
        </div>

        <div class="composer-config-rules">
          <button
            type="button"
            class="composer-config-rule-trigger"
            :class="{ open: rulesMenuOpen }"
            aria-haspopup="dialog"
            :aria-expanded="rulesMenuOpen"
            @click="rulesMenuOpen = !rulesMenuOpen"
          >
            <span>规则</span>
            <strong>{{ inlineConfig.rules.length }} 条</strong>
            <AppIcon name="chevron" :size="13" />
          </button>

          <div
            v-if="rulesMenuOpen"
            class="composer-rules-popover"
            role="dialog"
            aria-label="编辑对话规则"
            @keydown.esc="rulesMenuOpen = false"
          >
            <div class="composer-rules-popover-header">
              <span>对话规则</span>
              <small>每条规则会同步到底盘配置</small>
            </div>
            <div class="composer-rules-list">
              <div v-for="rule in inlineConfig.rules" :key="rule" class="composer-rule-row">
                <span>{{ rule }}</span>
                <button type="button" :aria-label="`删除规则：${rule}`" @click="removeRule(rule)">
                  <AppIcon name="x" :size="14" />
                </button>
              </div>
              <p v-if="!inlineConfig.rules.length" class="composer-rules-empty">暂未设置规则</p>
            </div>
            <form class="composer-rule-add" @submit.prevent="addRule">
              <input v-model="newRule" maxlength="80" placeholder="添加一条规则" aria-label="添加对话规则" />
              <button type="submit" aria-label="添加规则"><AppIcon name="plus" :size="15" /></button>
            </form>
          </div>
        </div>

        <div class="composer-config-tools" role="group" aria-label="工具权限">
          <span class="composer-config-tools-label">权限</span>
          <button
            v-for="tool in tools"
            :key="tool.key"
            type="button"
            class="composer-config-tool"
            :data-state="toolState(tool.key)"
            :aria-label="`${tool.label}：${toolStateLabel(tool.key)}，点击切换`"
            :aria-pressed="toolState(tool.key) !== 'deny'"
            @click="toggleTool(tool.key)"
          >
            <AppIcon :name="tool.icon" :size="14" />
            <span class="composer-tool-tip" role="tooltip">
              <span class="composer-tool-tip-name">{{ tool.label }}</span>
              <span class="composer-tool-tip-desc">{{ tool.desc }}</span>
              <span class="composer-tool-tip-state" :data-state="toolState(tool.key)">{{ toolStateLabel(tool.key) }}</span>
            </span>
          </button>
        </div>
      </div>
      <p v-if="error" class="composer-error">{{ error }}</p>
      <p v-if="attachmentError" class="composer-error" role="alert">{{ attachmentError }}</p>
      <div v-if="attachments.length" class="composer-attachments" aria-label="待发送附件">
        <div v-for="attachment in attachments" :key="attachment.id" class="composer-attachment">
          <img v-if="attachment.kind === 'image'" :src="attachment.dataUrl" :alt="attachment.name" />
          <span v-else class="composer-attachment-icon"><AppIcon name="file-text" :size="17" /></span>
          <span class="composer-attachment-copy">
            <strong :title="attachment.name">{{ attachment.name }}</strong>
            <small>{{ attachment.sizeLabel }}</small>
          </span>
          <button type="button" :aria-label="`移除附件：${attachment.name}`" @click="removeAttachment(attachment.id)">
            <AppIcon name="x" :size="14" />
          </button>
        </div>
      </div>
      <form class="composer" aria-label="发送消息" @submit.prevent="handlePrimaryAction">
        <input ref="fileInput" class="composer-file-input" type="file" multiple @change="selectFiles" />
        <input ref="imageInput" class="composer-file-input" type="file" accept="image/*" multiple @change="selectImages" />
        <div class="composer-upload-actions" aria-label="添加附件">
          <button type="button" :disabled="isSending" aria-label="上传文件" title="上传文件（最大 10 MB）" @click="fileInput?.click()">
            <AppIcon name="paperclip" :size="17" />
          </button>
          <button type="button" :disabled="isSending" aria-label="上传图片" title="上传图片（最大 5 MB）" @click="imageInput?.click()">
            <AppIcon name="image" :size="17" />
          </button>
        </div>
        <input
          v-model="draft"
          type="text"
          :disabled="isSending"
          placeholder="输入消息，继续当前对话"
        />
        <button type="submit" :class="{ 'stop-generation': isSending }" :disabled="!isSending && !canSend">
          <AppIcon :name="isSending ? 'stop' : 'send'" :size="16" />
          <span>{{ isSending ? '停止生成' : '发送' }}</span>
        </button>
      </form>
    </div>
  </section>
</template>
