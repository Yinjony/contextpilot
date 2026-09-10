<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import AppIcon from './AppIcon.vue'
import ChatMessage from './ChatMessage.vue'
import { createDefaultChatConfig, normalizeChatConfig } from '../model/opencode-bridge.js'
import { extractPdfText } from '../lib/pdf-text.js'

const props = defineProps({
  title: { type: String, default: 'AI Chat' },
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

const stages = ['Requirement Clarification', 'Solution Design', 'Implementation & Debugging', 'Testing & Validation', 'Delivery & Review']
const tools = [
  { key: 'readFiles', label: 'Read Files', icon: 'layers', desc: 'Allow reading files in the current project' },
  { key: 'runTests', label: 'Run Tests', icon: 'check', desc: 'Allow test and build commands' },
  { key: 'writeFiles', label: 'Write Files', icon: 'pencil', desc: 'Allow creating or editing project files' },
  { key: 'network', label: 'Network', icon: 'share', desc: 'Allow network and external API access' },
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
  return state === 'allow' ? 'Allowed' : state === 'confirm' ? 'Confirm' : 'Off'
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
    reader.onerror = () => reject(new Error(`Could not read file: ${file.name}`))
    reader.readAsDataURL(file)
  })
}

async function addAttachments(fileList, kind) {
  attachmentError.value = ''
  const incoming = [...(fileList || [])]
  if (!incoming.length) return
  if (attachments.value.length + incoming.length > 5) {
    attachmentError.value = 'You can attach up to 5 files per message.'
    return
  }

  const next = []
  for (const file of incoming) {
    const maxSize = kind === 'image' ? 5 * 1024 * 1024 : 10 * 1024 * 1024
    if (file.size > maxSize) {
      attachmentError.value = `${file.name} exceeds the ${kind === 'image' ? '5 MB' : '10 MB'} limit.`
      continue
    }
    if (kind === 'image' && !file.type.startsWith('image/')) {
      attachmentError.value = `${file.name} is not a supported image format.`
      continue
    }
    try {
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
      const pdf = isPdf ? await extractPdfText(file) : null
      next.push({
        id: `attachment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: file.name,
        mime: file.type || 'application/octet-stream',
        size: file.size,
        sizeLabel: formatFileSize(file.size),
        kind,
        dataUrl: await readAsDataURL(file),
        ...(pdf ? { extractedText: pdf.text, pageCount: pdf.pageCount, textTruncated: pdf.truncated } : {}),
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
    text: 'I approve writing to the project. Please complete the write operation for the target file described in your previous message without asking again for a path or confirmation.',
    attachments: [],
    approveWrite: true,
  })
}

function rejectWrite() {
  if (props.isSending) return
  emit('send', {
    text: 'Do not write to the project for now. Instead, generate a previewable and downloadable Markdown document in the chat.',
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
  <section class="chat-panel" aria-label="AI chat">
    <header class="chat-header">
      <div>
        <h2>{{ title }}</h2>
      </div>
<!--      <span class="model-chip"><span class="dot pulse"></span>opencode · deepseek-v4-flash-free</span>-->
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
      <div class="composer-config-bar" aria-label="Current conversation settings">
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
            aria-label="Choose conversation stage"
            @keydown.esc="stageMenuOpen = false"
          >
            <div class="composer-stage-popover-header">
              <span>Conversation Stage</span>
              <small>Step {{ stageIndex + 1 }} / {{ stages.length }}</small>
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
            <span>Rules</span>
            <strong>{{ inlineConfig.rules.length }}</strong>
            <AppIcon name="chevron" :size="13" />
          </button>

          <div
            v-if="rulesMenuOpen"
            class="composer-rules-popover"
            role="dialog"
            aria-label="Edit conversation rules"
            @keydown.esc="rulesMenuOpen = false"
          >
            <div class="composer-rules-popover-header">
              <span>Conversation Rules</span>
              <small>Rules are synced to the conversation settings</small>
            </div>
            <div class="composer-rules-list">
              <div v-for="rule in inlineConfig.rules" :key="rule" class="composer-rule-row">
                <span>{{ rule }}</span>
                <button type="button" :aria-label="`Delete rule: ${rule}`" @click="removeRule(rule)">
                  <AppIcon name="x" :size="14" />
                </button>
              </div>
              <p v-if="!inlineConfig.rules.length" class="composer-rules-empty">No rules set yet</p>
            </div>
            <form class="composer-rule-add" @submit.prevent="addRule">
              <input v-model="newRule" maxlength="80" placeholder="Add a rule" aria-label="Add conversation rule" />
              <button type="submit" aria-label="Add rule"><AppIcon name="plus" :size="15" /></button>
            </form>
          </div>
        </div>

        <div class="composer-config-tools" role="group" aria-label="Tool permissions">
          <span class="composer-config-tools-label">Access</span>
          <button
            v-for="tool in tools"
            :key="tool.key"
            type="button"
            class="composer-config-tool"
            :data-state="toolState(tool.key)"
            :aria-label="`${tool.label}: ${toolStateLabel(tool.key)}. Click to toggle.`"
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
      <div v-if="attachments.length" class="composer-attachments" aria-label="Attachments to send">
        <div v-for="attachment in attachments" :key="attachment.id" class="composer-attachment">
          <img v-if="attachment.kind === 'image'" :src="attachment.dataUrl" :alt="attachment.name" />
          <span v-else class="composer-attachment-icon"><AppIcon name="file-text" :size="17" /></span>
          <span class="composer-attachment-copy">
            <strong :title="attachment.name">{{ attachment.name }}</strong>
            <small>{{ attachment.sizeLabel }}</small>
          </span>
          <button type="button" :aria-label="`Remove attachment: ${attachment.name}`" @click="removeAttachment(attachment.id)">
            <AppIcon name="x" :size="14" />
          </button>
        </div>
      </div>
      <form class="composer" aria-label="Send message" @submit.prevent="handlePrimaryAction">
        <input ref="fileInput" class="composer-file-input" type="file" multiple @change="selectFiles" />
        <input ref="imageInput" class="composer-file-input" type="file" accept="image/*" multiple @change="selectImages" />
        <div class="composer-upload-actions" aria-label="Add attachments">
          <button type="button" :disabled="isSending" aria-label="Upload file" title="Upload file (max 10 MB)" @click="fileInput?.click()">
            <AppIcon name="paperclip" :size="17" />
          </button>
          <button type="button" :disabled="isSending" aria-label="Upload image" title="Upload image (max 5 MB)" @click="imageInput?.click()">
            <AppIcon name="image" :size="17" />
          </button>
        </div>
        <input
          v-model="draft"
          type="text"
          :disabled="isSending"
          placeholder="Type a message to continue this conversation"
        />
        <button type="submit" :class="{ 'stop-generation': isSending }" :disabled="!isSending && !canSend">
          <AppIcon :name="isSending ? 'stop' : 'send'" :size="16" />
          <span>{{ isSending ? 'Stop' : 'Send' }}</span>
        </button>
      </form>
    </div>
  </section>
</template>
