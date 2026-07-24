<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import AppIcon from './AppIcon.vue'
import {
  MIGRATION_CONTENT_TYPES,
  discardMigrationSession,
  generateMigrationDocument,
  startMigrationAnalysis,
} from '../model/chatAdapter.js'

const props = defineProps({
  sessions: { type: Array, default: () => [] },
})

const emit = defineEmits(['close'])

const t = {
  title: '\u8fc1\u79fb\u6587\u6863\u751f\u6210\u5668',
  idle: '\u7b49\u5f85\u5f00\u59cb\u5206\u6790',
  idleDescription: '\u5206\u6790\u5f53\u524d\u9879\u76ee\u7684\u4e3b\u5bf9\u8bdd\uff0c\u63d0\u53d6\u53ef\u4ea4\u63a5\u7684\u7ecf\u9a8c\u4e0e\u4e0a\u4e0b\u6587\u3002',
  analyze: '\u5f00\u59cb\u5206\u6790\u5e76\u83b7\u53d6\u5019\u9009\u5185\u5bb9',
  analyzing: '\u6b63\u5728\u5206\u6790\u5bf9\u8bdd\u8bb0\u5f55\u2026',
  selectTitle: '\u9009\u62e9\u8981\u5199\u5165\u8fc1\u79fb\u6587\u6863\u7684\u5185\u5bb9',
  selectDescription: '\u4f60\u53ef\u4ee5\u6839\u636e\u5019\u9009\u5185\u5bb9\u8c03\u6574\u9009\u62e9\uff0c\u4ec5\u5df2\u9009\u62e9\u7684\u7c7b\u522b\u4f1a\u8fdb\u5165\u6587\u6863\u3002',
  generate: '\u751f\u6210 Markdown \u9884\u89c8',
  generating: '\u6b63\u5728\u751f\u6210\u8fc1\u79fb\u6587\u6863\u2026',
  retry: '\u91cd\u65b0\u5206\u6790',
  back: '\u8fd4\u56de\u9009\u62e9',
  close: '\u5173\u95ed',
  copy: '\u590d\u5236',
  copied: '\u5df2\u590d\u5236',
  export: '\u5bfc\u51fa .md',
  edit: '\u7f16\u8f91',
  preview: '\u9884\u89c8',
  selected: '\u5df2\u9009\u62e9',
  noEvidence: '\u672a\u53d1\u73b0\u8db3\u591f\u8bc1\u636e',
  recommended: '\u5efa\u8bae\u4fdd\u7559',
  documentName: '\u8fc1\u79fb\u6587\u6863\u540d\u79f0',
}

marked.setOptions({ breaks: true, gfm: true })

const phase = ref('idle')
const candidates = ref(MIGRATION_CONTENT_TYPES.map((item) => ({ ...item, available: false, summary: '', evidence: '' })))
const selectedIDs = ref([])
const temporarySessionID = ref('')
const markdown = ref('')
const documentTitle = ref('\u9879\u76ee - \u8fc1\u79fb\u6587\u6863')
const previewMode = ref('preview')
const error = ref('')
const copied = ref(false)
let requestController = null

const selectedCount = computed(() => selectedIDs.value.length)
const previewHTML = computed(() => {
  if (!markdown.value) return ''
  return DOMPurify.sanitize(marked.parse(markdown.value))
})

function phaseText() {
  if (phase.value === 'analyzing') return t.analyzing
  if (phase.value === 'generating') return t.generating
  return t.idle
}

function isSelected(id) {
  return selectedIDs.value.includes(id)
}

function toggleCandidate(id) {
  selectedIDs.value = isSelected(id)
    ? selectedIDs.value.filter((item) => item !== id)
    : [...selectedIDs.value, id]
}

function selectRecommendations(list) {
  const recommended = list.filter((item) => item.recommended && item.available).map((item) => item.id)
  const fallback = list.filter((item) => item.recommended).map((item) => item.id)
  selectedIDs.value = recommended.length ? recommended : fallback
}

async function startAnalysis() {
  if (phase.value === 'analyzing' || phase.value === 'generating') return
  error.value = ''
  copied.value = false
  phase.value = 'analyzing'
  requestController = new AbortController()
  try {
    const result = await startMigrationAnalysis({
      sessions: props.sessions,
      signal: requestController.signal,
    })
    temporarySessionID.value = result.sessionID
    candidates.value = result.candidates
    selectRecommendations(result.candidates)
    phase.value = 'select'
  } catch (cause) {
    if (cause?.name !== 'AbortError') error.value = cause?.message || String(cause)
    phase.value = 'idle'
  } finally {
    requestController = null
  }
}

async function generatePreview() {
  if (!selectedCount.value || !temporarySessionID.value || phase.value === 'generating') return
  error.value = ''
  phase.value = 'generating'
  requestController = new AbortController()
  const currentID = temporarySessionID.value
  try {
    markdown.value = await generateMigrationDocument({
      sessionID: currentID,
      sessions: props.sessions,
      selectedTypeIDs: selectedIDs.value,
      signal: requestController.signal,
    })
    documentTitle.value = (props.sessions.find((session) => session?.title)?.title || '\u9879\u76ee') + ' - \u8fc1\u79fb\u6587\u6863'
    previewMode.value = 'preview'
    phase.value = 'preview'
  } catch (cause) {
    if (cause?.name !== 'AbortError') error.value = cause?.message || String(cause)
    phase.value = 'idle'
  } finally {
    temporarySessionID.value = ''
    requestController = null
  }
}

async function discardTemporarySession() {
  const id = temporarySessionID.value
  temporarySessionID.value = ''
  if (id) await discardMigrationSession(id)
}

async function close() {
  requestController?.abort()
  await discardTemporarySession()
  emit('close')
}

async function copyMarkdown() {
  if (!markdown.value) return
  try {
    await navigator.clipboard.writeText(markdown.value)
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = markdown.value
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.append(textarea)
    textarea.select()
    document.execCommand('copy')
    textarea.remove()
  }
  copied.value = true
  window.setTimeout(() => { copied.value = false }, 1600)
}

function exportMarkdown() {
  if (!markdown.value) return
  const blob = new Blob([markdown.value], { type: 'text/markdown;charset=utf-8' })
  const link = document.createElement('a')
  const safeName = (documentTitle.value || '\u8fc1\u79fb\u6587\u6863').replace(/[\\/:*?"<>|]/g, '-')
  link.href = URL.createObjectURL(blob)
  link.download = safeName + '.md'
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(link.href), 0)
}

function onKeydown(event) {
  if (event.key === 'Escape') close()
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  requestController?.abort()
  void discardTemporarySession()
})
</script>

<template>
  <div class="migration-overlay" @click.self="close">
    <section class="migration-modal" role="dialog" aria-modal="true" :aria-label="t.title">
      <header class="migration-header">
        <div class="migration-heading">
          <span class="migration-icon"><AppIcon name="file-text" :size="20" /></span>
          <div>
            <h2>{{ t.title }}</h2>
            <p>{{ phaseText() }}</p>
          </div>
        </div>
        <button type="button" class="migration-close" :aria-label="t.close" @click="close">
          <AppIcon name="x" :size="19" />
        </button>
      </header>

      <div class="migration-steps" :class="{ compact: phase === 'preview' }" aria-label="workflow">
        <span :class="{ active: phase !== 'idle' }"><i>1</i>{{ t.analyze }}</span>
        <span :class="{ active: ['select', 'generating', 'preview'].includes(phase) }"><i>2</i>{{ t.selectTitle }}</span>
        <span :class="{ active: phase === 'preview' }"><i>3</i>{{ t.preview }}</span>
      </div>

      <p v-if="error" class="migration-error">{{ error }}</p>

      <div v-if="phase === 'idle'" class="migration-idle">
        <span class="migration-hero-icon"><AppIcon name="layers" :size="34" /></span>
        <h3>{{ t.idle }}</h3>
        <p>{{ t.idleDescription }}</p>
        <button type="button" class="migration-primary" @click="startAnalysis">
          <AppIcon name="sparkles" :size="17" />
          <span>{{ t.analyze }}</span>
        </button>
      </div>

      <div v-else-if="phase === 'analyzing' || phase === 'generating'" class="migration-loading" aria-live="polite">
        <span class="loading-orbit"></span>
        <h3>{{ phaseText() }}</h3>
        <p>{{ phase === 'analyzing' ? t.idleDescription : t.selectDescription }}</p>
      </div>

      <div v-else-if="phase === 'select'" class="migration-select">
        <div class="migration-section-title">
          <div>
            <h3>{{ t.selectTitle }}</h3>
            <p>{{ t.selectDescription }}</p>
          </div>
          <button type="button" class="migration-text-button" @click="startAnalysis">{{ t.retry }}</button>
        </div>

        <div class="migration-candidates">
          <button
            v-for="candidate in candidates"
            :key="candidate.id"
            type="button"
            class="migration-candidate"
            :class="[{ selected: isSelected(candidate.id), unavailable: !candidate.available }, candidate.color]"
            @click="toggleCandidate(candidate.id)"
          >
            <span class="candidate-check"><AppIcon v-if="isSelected(candidate.id)" name="check" :size="14" /></span>
            <span class="candidate-main">
              <span class="candidate-topline">
                <strong>{{ candidate.label }}</strong>
                <em v-if="candidate.recommended">{{ t.recommended }}</em>
              </span>
              <small>{{ candidate.summary || candidate.description }}</small>
              <span class="candidate-evidence">{{ candidate.available ? candidate.evidence || candidate.description : t.noEvidence }}</span>
            </span>
          </button>
        </div>

        <footer class="migration-actions">
          <span>{{ t.selected }} {{ selectedCount }} / {{ candidates.length }}</span>
          <button type="button" class="migration-primary" :disabled="!selectedCount" @click="generatePreview">
            <AppIcon name="file-text" :size="17" />
            <span>{{ t.generate }}</span>
          </button>
        </footer>
      </div>

      <div v-else class="migration-preview">
        <div class="preview-toolbar">
          <label class="preview-name">
            <span>{{ t.documentName }}</span>
            <input v-model="documentTitle" type="text" />
          </label>
          <div class="preview-actions">
            <button type="button" class="migration-tool-button" @click="previewMode = previewMode === 'preview' ? 'edit' : 'preview'">
              <AppIcon :name="previewMode === 'preview' ? 'pencil' : 'eye'" :size="16" />
              <span>{{ previewMode === 'preview' ? t.edit : t.preview }}</span>
            </button>
            <button type="button" class="migration-tool-button" @click="copyMarkdown">
              <AppIcon name="copy" :size="16" />
              <span>{{ copied ? t.copied : t.copy }}</span>
            </button>
            <button type="button" class="migration-tool-button primary-tool" @click="exportMarkdown">
              <AppIcon name="download" :size="16" />
              <span>{{ t.export }}</span>
            </button>
          </div>
        </div>
        <textarea
          v-if="previewMode === 'edit'"
          v-model="markdown"
          class="migration-markdown-editor"
          spellcheck="false"
          aria-label="Markdown editor"
        ></textarea>
        <article v-else class="migration-markdown-body markdown-body" v-html="previewHTML"></article>
        <footer class="preview-footer">
          <button type="button" class="migration-text-button" @click="phase = 'select'">{{ t.back }}</button>
          <span>{{ t.idleDescription }}</span>
        </footer>
      </div>
    </section>
  </div>
</template>

<style scoped>
.migration-overlay {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: grid;
  place-items: center;
  padding: 22px;
  background: rgba(15, 23, 42, .48);
  backdrop-filter: blur(5px);
}

.migration-modal {
  width: min(960px, 100%);
  max-height: min(820px, calc(100vh - 44px));
  overflow: auto;
  border: 1px solid var(--line, #dbe3ef);
  border-radius: 18px;
  background: var(--panel, #fff);
  color: var(--ink, #172033);
  box-shadow: 0 24px 70px rgba(15, 23, 42, .28);
}

.migration-header, .preview-toolbar, .migration-actions, .preview-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.migration-header {
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--line, #e5eaf1);
}

.migration-heading { display: flex; align-items: center; gap: 12px; min-width: 0; }
.migration-icon, .migration-hero-icon { display: grid; place-items: center; color: #4d63d8; background: #eef1ff; border-radius: 11px; }
.migration-icon { width: 40px; height: 40px; flex: 0 0 auto; }
.migration-heading h2, .migration-heading p, .migration-idle h3, .migration-idle p, .migration-section-title h3, .migration-section-title p, .migration-loading h3, .migration-loading p { margin: 0; }
.migration-heading h2 { font-size: 17px; letter-spacing: -.01em; }
.migration-heading p, .migration-section-title p, .migration-idle p, .migration-loading p { margin-top: 4px; color: var(--muted, #728096); font-size: 13px; }
.migration-close, .migration-tool-button, .migration-text-button { border: 0; background: transparent; color: var(--muted, #657188); cursor: pointer; }
.migration-close { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 8px; }
.migration-close:hover, .migration-tool-button:hover { background: #f2f5f9; color: var(--ink, #172033); }

.migration-steps { display: flex; align-items: center; gap: 22px; padding: 14px 24px; border-bottom: 1px solid var(--line, #e5eaf1); color: #9aa5b5; font-size: 12px; white-space: nowrap; overflow-x: auto; }
.migration-steps span { display: inline-flex; align-items: center; gap: 7px; }
.migration-steps i { display: grid; place-items: center; width: 19px; height: 19px; border: 1px solid currentColor; border-radius: 50%; font-style: normal; font-size: 11px; }
.migration-steps span.active { color: #4d63d8; font-weight: 650; }
.migration-steps span.active i { border-color: #4d63d8; background: #eef1ff; }
.migration-error { margin: 14px 24px 0; padding: 10px 12px; border: 1px solid #ffd6d2; border-radius: 9px; color: #bd3b31; background: #fff5f4; font-size: 13px; }

.migration-idle, .migration-loading { min-height: 365px; padding: 42px 24px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.migration-hero-icon { width: 72px; height: 72px; margin-bottom: 17px; border-radius: 21px; }
.migration-idle h3, .migration-loading h3 { font-size: 18px; }
.migration-idle p, .migration-loading p { max-width: 460px; line-height: 1.7; }
.migration-primary { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 38px; padding: 0 15px; border: 0; border-radius: 9px; background: #4d63d8; color: white; font-weight: 650; cursor: pointer; box-shadow: 0 7px 16px rgba(77, 99, 216, .2); }
.migration-idle .migration-primary { margin-top: 24px; }
.migration-primary:hover { background: #3e53c8; }
.migration-primary:disabled { cursor: not-allowed; opacity: .5; box-shadow: none; }
.loading-orbit { width: 34px; height: 34px; margin-bottom: 17px; border: 3px solid #e2e6fa; border-top-color: #4d63d8; border-radius: 50%; animation: migration-spin .8s linear infinite; }
@keyframes migration-spin { to { transform: rotate(360deg); } }

.migration-select { padding: 22px 24px 18px; }
.migration-section-title { display: flex; justify-content: space-between; gap: 14px; align-items: flex-start; margin-bottom: 17px; }
.migration-section-title h3 { font-size: 16px; }
.migration-text-button { padding: 7px 3px; color: #4d63d8; font-size: 13px; white-space: nowrap; }
.migration-text-button:hover { text-decoration: underline; }
.migration-candidates { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.migration-candidate { display: flex; gap: 11px; min-width: 0; padding: 13px; border: 1px solid #e1e7ef; border-left-width: 3px; border-radius: 11px; background: #fff; text-align: left; cursor: pointer; transition: border-color .16s ease, box-shadow .16s ease, background .16s ease; }
.migration-candidate:hover { border-color: #aab8ed; box-shadow: 0 4px 12px rgba(36, 54, 93, .07); }
.migration-candidate.selected { border-color: #4d63d8; background: #f8f9ff; }
.migration-candidate.unavailable { opacity: .72; }
.migration-candidate.blue { border-left-color: #5391d8; } .migration-candidate.green { border-left-color: #45aa85; } .migration-candidate.purple { border-left-color: #8b6ad8; } .migration-candidate.cyan { border-left-color: #43a9be; } .migration-candidate.teal { border-left-color: #36a798; } .migration-candidate.orange { border-left-color: #de9654; } .migration-candidate.red { border-left-color: #d86161; }
.candidate-check { display: grid; place-items: center; flex: 0 0 auto; width: 18px; height: 18px; margin-top: 1px; border: 1px solid #c7d0de; border-radius: 5px; color: #fff; }
.selected .candidate-check { border-color: #4d63d8; background: #4d63d8; }
.candidate-main { display: grid; gap: 4px; min-width: 0; }
.candidate-topline { display: flex; align-items: center; gap: 7px; min-width: 0; }
.candidate-topline strong { font-size: 13px; color: #263248; }
.candidate-topline em { padding: 2px 5px; border-radius: 4px; background: #edf0ff; color: #576bd5; font-size: 10px; font-style: normal; white-space: nowrap; }
.candidate-main small { overflow: hidden; color: #68768a; font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.candidate-evidence { overflow: hidden; color: #9aa5b5; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
.migration-actions { margin-top: 18px; padding-top: 15px; border-top: 1px solid #e8ecf2; color: #77849a; font-size: 13px; }

.migration-preview { padding: 20px 24px 18px; }
.preview-toolbar { align-items: flex-end; margin-bottom: 15px; }
.preview-name { display: grid; gap: 5px; min-width: 220px; color: #79859a; font-size: 11px; }
.preview-name input { width: min(360px, 100%); padding: 6px 0; border: 0; border-bottom: 1px solid #d8dfeb; outline: none; color: #263248; background: transparent; font-size: 15px; font-weight: 650; }
.preview-name input:focus { border-bottom-color: #4d63d8; }
.preview-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 6px; }
.migration-tool-button { display: inline-flex; align-items: center; gap: 6px; padding: 8px 10px; border: 1px solid #dfe5ee; border-radius: 8px; font-size: 12px; }
.migration-tool-button.primary-tool { border-color: #4d63d8; background: #4d63d8; color: #fff; }
.migration-tool-button.primary-tool:hover { background: #3e53c8; color: #fff; }
.migration-markdown-body, .migration-markdown-editor { min-height: 410px; max-height: calc(100vh - 325px); overflow: auto; box-sizing: border-box; padding: 25px clamp(18px, 5vw, 64px); border: 1px solid #e3e8f0; border-radius: 11px; background: #fff; }
.migration-markdown-body :deep(h1) { margin-top: 0; font-size: 25px; }
.migration-markdown-body :deep(h2) { margin-top: 28px; padding-bottom: 8px; border-bottom: 1px solid #e7ebf1; font-size: 18px; }
.migration-markdown-body :deep(p), .migration-markdown-body :deep(li) { color: #344155; line-height: 1.8; }
.migration-markdown-body :deep(pre) { overflow: auto; padding: 12px; border-radius: 8px; background: #f5f7fa; }
.migration-markdown-editor { width: 100%; resize: vertical; outline: none; color: #2d3a4f; font: 13px/1.75 ui-monospace, SFMono-Regular, Consolas, monospace; }
.preview-footer { margin-top: 13px; color: #9aa5b5; font-size: 12px; }

@media (max-width: 680px) {
  .migration-overlay { padding: 0; }
  .migration-modal { max-height: 100vh; min-height: 100vh; border-radius: 0; }
  .migration-header, .migration-select, .migration-preview { padding-left: 16px; padding-right: 16px; }
  .migration-steps { padding-left: 16px; padding-right: 16px; gap: 14px; }
  .migration-candidates { grid-template-columns: 1fr; }
  .preview-toolbar, .migration-actions { align-items: stretch; flex-direction: column; }
  .preview-actions { justify-content: flex-start; }
  .preview-name { width: 100%; }
  .preview-name input { width: 100%; }
}
</style>
