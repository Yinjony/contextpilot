<script setup>
import { computed, ref } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import AppIcon from './AppIcon.vue'
import { readProjectMarkdown } from '../model/chatAdapter.js'

const props = defineProps({
  message: {
    type: Object,
    required: true,
  },
  projectDirectory: { type: String, default: '' },
})

defineEmits(['approve-write', 'reject-write'])
const previewArtifact = ref(null)

// assistant 正文用 markdown 渲染（marked 解析 + DOMPurify 防 XSS）。
marked.setOptions({ breaks: true, gfm: true })
const renderedText = computed(() => {
  const text = displayText.value
  if (!text) return ''
  return DOMPurify.sanitize(marked.parse(text))
})

const parsedContent = computed(() => {
  const source = String(props.message.text || '')
  const artifacts = []
  const pattern = /<contextpilot-artifact(?:\s+filename="([^"]+)")?\s*>([\s\S]*?)<\/contextpilot-artifact>/gi
  let text = source.replace(pattern, (_, filename, content) => {
    const safeName = String(filename || `document-${artifacts.length + 1}.md`)
      .replace(/[\\/:*?"<>|]/g, '-')
      .trim()
    artifacts.push({
      id: `${props.message.id || 'message'}-artifact-${artifacts.length + 1}`,
      filename: safeName.toLowerCase().endsWith('.md') ? safeName : `${safeName}.md`,
      content: String(content || '').trim(),
    })
    return ''
  }).trim()
  // 流式生成时先隐藏尚未闭合的制品容器，避免 XML 标记和半成品正文闪现在聊天气泡中。
  const pendingArtifactIndex = text.search(/<contextpilot-artifact(?:\s|>)/i)
  if (props.message.pending && pendingArtifactIndex >= 0) {
    text = `${text.slice(0, pendingArtifactIndex).trim()}\n\n正在生成 Markdown 文档…`.trim()
  }
  return { text, artifacts }
})

const displayText = computed(() => parsedContent.value.text)
const artifacts = computed(() => parsedContent.value.artifacts)
const projectMarkdownFiles = computed(() => {
  if (props.message.role !== 'assistant' || artifacts.value.length) return []
  const matches = String(props.message.text || '').matchAll(/(?:^|[\s`'"（(])((?:docs|reports|output)\/[^\s`'"<>]+?\.md)(?=$|[\s`'"，。；、）)])/giu)
  return [...new Set([...matches].map((match) => match[1]))].map((path, index) => ({
    id: `${props.message.id || 'message'}-project-md-${index + 1}`,
    filename: path.split('/').at(-1) || 'document.md',
    path,
    source: 'project',
  }))
})
const writeConfirmation = computed(() => {
  if (props.message.role !== 'assistant' || props.message.pending || props.message.error || artifacts.value.length) return false
  const text = String(props.message.text || '')
  const asksForConfirmation = /(请确认|是否同意|若同意|需要.{0,12}确认|同意我)/i.test(text)
  const concernsWriting = /(写入|修改|新建|创建|保存).{0,24}(文件|项目|目录)|(文件|项目|目录).{0,24}(写入|修改|新建|创建|保存)/i.test(text)
  return asksForConfirmation && concernsWriting
})

const renderedArtifact = computed(() => {
  const content = previewArtifact.value?.content
  return content ? DOMPurify.sanitize(marked.parse(content)) : ''
})

function downloadArtifact(artifact) {
  const blob = new Blob([artifact.content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = artifact.filename
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

async function saveArtifact(artifact) {
  if (typeof window.showSaveFilePicker !== 'function') {
    downloadArtifact(artifact)
    return
  }
  try {
    const handle = await window.showSaveFilePicker({
      suggestedName: artifact.filename,
      types: [{ description: 'Markdown 文档', accept: { 'text/markdown': ['.md'] } }],
    })
    const writable = await handle.createWritable()
    await writable.write(artifact.content)
    await writable.close()
  } catch (error) {
    if (error?.name !== 'AbortError') throw error
  }
}

async function openArtifact(artifact) {
  if (artifact.source !== 'project') {
    previewArtifact.value = artifact
    return
  }
  previewArtifact.value = { ...artifact, loading: true, content: '' }
  try {
    const content = await readProjectMarkdown(artifact.path, props.projectDirectory)
    previewArtifact.value = { ...artifact, content, loading: false }
  } catch (error) {
    previewArtifact.value = {
      ...artifact,
      content: '',
      loading: false,
      error: error instanceof Error ? error.message : '文件读取失败。',
    }
  }
}

</script>

<template>
  <article class="message" :class="message.role">
    <div class="bubble" :class="{ pending: message.pending, error: message.error }">
      <details
        v-if="message.role === 'assistant' && message.reasoning"
        class="reasoning"
        open
      >
        <summary class="reasoning-summary">思考过程</summary>
        <div class="reasoning-text">{{ message.reasoning }}</div>
      </details>

      <h3 v-if="message.heading">{{ message.heading }}</h3>
      <p v-if="message.role !== 'assistant' || message.error">{{ message.text }}</p>
      <div v-else-if="displayText" class="markdown-body" v-html="renderedText"></div>

      <div v-if="artifacts.length" class="message-artifacts" aria-label="生成的 Markdown 文档">
        <button
          v-for="artifact in artifacts"
          :key="artifact.id"
          type="button"
          class="message-artifact-card"
          @click="openArtifact(artifact)"
        >
          <span class="message-artifact-icon"><AppIcon name="file-text" :size="20" /></span>
          <span>
            <strong>{{ artifact.filename }}</strong>
            <small>Markdown 文档 · 点击预览</small>
          </span>
          <AppIcon name="chevron" :size="15" />
        </button>
      </div>

      <div v-if="projectMarkdownFiles.length" class="message-artifacts" aria-label="项目中的 Markdown 文档">
        <button
          v-for="artifact in projectMarkdownFiles"
          :key="artifact.id"
          type="button"
          class="message-artifact-card"
          @click="openArtifact(artifact)"
        >
          <span class="message-artifact-icon"><AppIcon name="file-text" :size="20" /></span>
          <span>
            <strong>{{ artifact.filename }}</strong>
            <small>{{ artifact.path }} · 点击预览</small>
          </span>
          <AppIcon name="chevron" :size="15" />
        </button>
      </div>

      <div v-if="writeConfirmation" class="message-approval" aria-label="写入项目确认">
        <p><strong>需要写入项目文件</strong><span>本次授权仅对下一轮写入生效。</span></p>
        <div>
          <button type="button" class="message-approval-secondary" @click="$emit('reject-write')">改为生成 MD</button>
          <button type="button" class="message-approval-primary" @click="$emit('approve-write')">同意写入</button>
        </div>
      </div>

      <div v-if="message.attachments?.length" class="message-attachments" aria-label="消息附件">
        <div v-for="attachment in message.attachments" :key="attachment.id || attachment.name" class="message-attachment">
          <img v-if="attachment.kind === 'image'" :src="attachment.dataUrl" :alt="attachment.name" />
          <span v-else class="message-attachment-icon"><AppIcon name="file-text" :size="17" /></span>
          <span>
            <strong :title="attachment.name">{{ attachment.name }}</strong>
            <small v-if="attachment.sizeLabel">{{ attachment.sizeLabel }}</small>
          </span>
        </div>
      </div>

      <div v-if="message.codeBlock" class="fix-block">
        <div class="fix-head">
          <span class="fix-dots"><i></i><i></i><i></i></span>
          <code class="fix-file">{{ message.codeBlock.file }}</code>
          <span class="fix-lang">{{ message.codeBlock.language }}</span>
        </div>
        <pre><code>{{ message.codeBlock.code }}</code></pre>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="previewArtifact" class="artifact-preview-overlay" @mousedown.self="previewArtifact = null">
        <section class="artifact-preview-modal" role="dialog" aria-modal="true" aria-labelledby="artifact-preview-title">
          <header>
            <div>
              <span class="message-artifact-icon"><AppIcon name="file-text" :size="20" /></span>
              <div><small>Markdown 文档预览</small><h2 id="artifact-preview-title">{{ previewArtifact.filename }}</h2></div>
            </div>
            <button type="button" class="icon-btn" aria-label="关闭预览" @click="previewArtifact = null"><AppIcon name="x" :size="18" /></button>
          </header>
          <div v-if="previewArtifact.loading" class="artifact-preview-state" role="status">正在读取项目文件…</div>
          <div v-else-if="previewArtifact.error" class="artifact-preview-state is-error" role="alert">
            <strong>无法预览文件</strong><span>{{ previewArtifact.error }}</span>
          </div>
          <div v-else class="artifact-preview-body markdown-body" v-html="renderedArtifact"></div>
          <footer>
            <button type="button" class="secondary-action" :disabled="!previewArtifact.content" @click="downloadArtifact(previewArtifact)">下载 .md</button>
            <button type="button" class="primary-action" :disabled="!previewArtifact.content" @click="saveArtifact(previewArtifact)">保存到…</button>
          </footer>
        </section>
      </div>
    </Teleport>
  </article>
</template>
