<script setup>
import { computed, nextTick, ref, watch, onBeforeUnmount } from 'vue'
import AppIcon from './AppIcon.vue'
import { createDefaultChatConfig, normalizeChatConfig } from '../model/chatAdapter.js'

const props = defineProps({
  sessionTitle: { type: String, required: true },
  config: { type: Object, default: () => createDefaultChatConfig() },
  saving: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

const emit = defineEmits(['close', 'save'])

const stages = ['Requirement Clarification', 'Solution Design', 'Implementation & Debugging', 'Testing & Validation', 'Delivery & Review']
const suggestedRules = ['Lead with an actionable conclusion', 'State assumptions when uncertain', 'Include a verification method for change suggestions']
const tools = [
  { key: 'readFiles', label: 'Read Files', description: 'Allow reading current project files and configuration', icon: 'layers' },
  { key: 'runTests', label: 'Run Tests', description: 'Allow running tests and producing verification results', icon: 'check' },
  { key: 'writeFiles', label: 'Write Files', description: 'Require human confirmation before writing', icon: 'pencil' },
  { key: 'network', label: 'Network', description: 'Allow access to external networks and documents', icon: 'share' },
]

const draft = ref(createDefaultChatConfig())
const newRule = ref('')

// Custom stage dropdown: native select popovers are rendered by the OS, so this
// keeps the dropdown visually consistent with the modal and supports outside click / ESC.
const stageMenuOpen = ref(false)
const stageSelectRef = ref(null)

function toggleStageMenu() {
  stageMenuOpen.value = !stageMenuOpen.value
}

async function chooseStage(stage) {
  draft.value.stage = stage
  stageMenuOpen.value = false
}

function onDocumentClick(event) {
  if (!stageMenuOpen.value) return
  if (stageSelectRef.value && !stageSelectRef.value.contains(event.target)) {
    stageMenuOpen.value = false
  }
}

function onDocumentKeydown(event) {
  if (event.key === 'Escape' && stageMenuOpen.value) stageMenuOpen.value = false
}

watch(stageMenuOpen, (open) => {
  if (open) {
    document.addEventListener('click', onDocumentClick)
    document.addEventListener('keydown', onDocumentKeydown)
    nextTick(() => {
      const active = stageSelectRef.value?.querySelector('.config-select-option.active')
      active?.scrollIntoView({ block: 'nearest' })
    })
  } else {
    document.removeEventListener('click', onDocumentClick)
    document.removeEventListener('keydown', onDocumentKeydown)
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
  document.removeEventListener('keydown', onDocumentKeydown)
})

watch(
  () => props.config,
  (config) => {
    draft.value = normalizeChatConfig(config)
    newRule.value = ''
  },
  { immediate: true, deep: true },
)

const activeRules = computed(() => draft.value.rules || [])

function toggleRule(rule) {
  const rules = [...activeRules.value]
  const index = rules.indexOf(rule)
  if (index >= 0) rules.splice(index, 1)
  else rules.push(rule)
  draft.value.rules = rules
}

function addRule() {
  const value = newRule.value.trim()
  if (!value || activeRules.value.includes(value)) return
  draft.value.rules = [...activeRules.value, value]
  newRule.value = ''
}

function removeRule(rule) {
  draft.value.rules = activeRules.value.filter((item) => item !== rule)
}

function toolState(key) {
  return draft.value.toolPermissions?.[key] || 'deny'
}

function toolStateLabel(key) {
  const state = toolState(key)
  return state === 'allow' ? 'Allowed' : state === 'confirm' ? 'Confirm' : 'Off'
}

function toggleTool(key) {
  const state = toolState(key)
  const next = state === 'deny' ? (key === 'writeFiles' ? 'confirm' : 'allow') : 'deny'
  draft.value.toolPermissions = {
    ...draft.value.toolPermissions,
    [key]: next,
  }
}

function submit() {
  emit('save', normalizeChatConfig(draft.value))
}
</script>

<template>
  <Teleport to="body">
    <div class="session-config-overlay" role="presentation" @click.self="$emit('close')">
      <section
        class="session-config-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-config-title"
        @keydown.esc="$emit('close')"
      >
        <header class="session-config-header">
          <div>
            <div class="session-config-title-row">
              <h2 id="session-config-title">Conversation Settings</h2>
              <span class="modal-session-context" :title="sessionTitle">
                <small>Current Chat</small>
                <strong>{{ sessionTitle }}</strong>
              </span>
            </div>
            <p>Settings are saved with this chat and applied as system guidance in later turns.</p>
          </div>
          <button type="button" class="icon-btn session-config-close" aria-label="Close conversation settings" @click="$emit('close')">
            <AppIcon name="x" :size="18" />
          </button>
        </header>

        <form class="session-config-form" @submit.prevent="submit">
          <div class="config-row">
            <div class="config-row-label">
              <span class="config-row-number">1</span>
              <div>
                <h3>Conversation Goal</h3>
                <p>Define the goal and expected output for this chat</p>
              </div>
            </div>
            <label class="config-field">
              <span class="sr-only">Conversation goal</span>
              <textarea v-model="draft.goal" maxlength="300" placeholder="Example: identify why payment callback states are inconsistent and propose a verifiable fix."></textarea>
              <small>{{ draft.goal.length }} / 300</small>
            </label>
          </div>

          <div class="config-row">
            <div class="config-row-label">
              <span class="config-row-number">2</span>
              <div>
                <h3>Current Stage</h3>
                <p>Help the model focus on the current collaboration priority</p>
              </div>
            </div>
            <div ref="stageSelectRef" class="config-select" :class="{ open: stageMenuOpen }">
              <button
                type="button"
                class="config-select-trigger"
                aria-haspopup="listbox"
                :aria-expanded="stageMenuOpen"
                @click="toggleStageMenu"
              >
                <span class="config-select-value">{{ draft.stage }}</span>
                <AppIcon name="chevron-down" :size="17" class="config-select-caret" />
              </button>

              <transition name="config-select-pop">
                <ul v-if="stageMenuOpen" class="config-select-menu" role="listbox" aria-label="Current stage">
                  <li v-for="stage in stages" :key="stage" role="option" :aria-selected="stage === draft.stage">
                    <button
                      type="button"
                      class="config-select-option"
                      :class="{ active: stage === draft.stage }"
                      @click="chooseStage(stage)"
                    >
                      <span class="config-select-option-label">{{ stage }}</span>
                      <AppIcon v-if="stage === draft.stage" name="check" :size="14" class="config-select-option-mark" />
                    </button>
                  </li>
                </ul>
              </transition>
            </div>
          </div>

          <div class="config-row">
            <div class="config-row-label">
              <span class="config-row-number">3</span>
              <div>
                <h3>Conversation Rules</h3>
                <p>Constrain how the model should answer in this chat</p>
              </div>
            </div>
            <div class="config-rules">
              <button
                v-for="rule in suggestedRules"
                :key="rule"
                type="button"
                class="config-rule"
                :class="{ selected: activeRules.includes(rule) }"
                :aria-pressed="activeRules.includes(rule)"
                @click="toggleRule(rule)"
              >
                <span class="config-rule-check"><AppIcon name="check" :size="13" /></span>
                {{ rule }}
              </button>
              <label class="config-add-rule">
                <span class="sr-only">Add conversation rule</span>
                <input v-model="newRule" maxlength="80" placeholder="Add rule" @keydown.enter.prevent="addRule" />
                <button type="button" aria-label="Add rule" @click="addRule"><AppIcon name="plus" :size="15" /></button>
              </label>
              <button
                v-for="rule in activeRules.filter((rule) => !suggestedRules.includes(rule))"
                :key="rule"
                type="button"
                class="config-rule selected custom"
                :title="rule"
                @click="removeRule(rule)"
              >
                {{ rule }}
                <AppIcon name="x" :size="14" />
              </button>
            </div>
          </div>

          <div class="config-row">
            <div class="config-row-label">
              <span class="config-row-number">4</span>
              <div>
                <h3>Tool Permissions</h3>
                <p>Set tool boundaries for this and later turns</p>
              </div>
            </div>
            <div class="config-tool-grid">
              <article v-for="tool in tools" :key="tool.key" class="config-tool" :data-state="toolState(tool.key)">
                <div class="config-tool-topline">
                  <span class="config-tool-icon"><AppIcon :name="tool.icon" :size="17" /></span>
                  <span class="config-tool-state">{{ toolStateLabel(tool.key) }}</span>
                </div>
                <h4>{{ tool.label }}</h4>
                <p>{{ tool.description }}</p>
                <button
                  type="button"
                  class="config-switch"
                  :class="{ enabled: toolState(tool.key) !== 'deny' }"
                  :aria-label="`${tool.label} is ${toolState(tool.key) === 'deny' ? 'off. Click to enable.' : 'on. Click to disable.'}`"
                  :aria-pressed="toolState(tool.key) !== 'deny'"
                  @click="toggleTool(tool.key)"
                >
                  <span></span>
                </button>
              </article>
            </div>
          </div>

          <div class="config-row">
            <div class="config-row-label">
              <span class="config-row-number">5</span>
              <div>
                <h3>Acceptance Criteria</h3>
                <p>Define the conditions for completing the current goal</p>
              </div>
            </div>
            <label class="config-field">
              <span class="sr-only">Acceptance criteria</span>
              <textarea v-model="draft.acceptanceCriteria" maxlength="500" placeholder="Example: provide the root cause, suggested changes, impact scope, and executable verification steps."></textarea>
              <small>{{ draft.acceptanceCriteria.length }} / 500</small>
            </label>
          </div>

          <div class="config-row">
            <div class="config-row-label">
              <span class="config-row-number">6</span>
              <div>
                <h3>Project Memory</h3>
                <p>Record facts, decisions, and constraints that should persist across turns</p>
              </div>
            </div>
            <label class="config-field">
              <span class="sr-only">Project memory</span>
              <textarea v-model="draft.projectMemory" maxlength="500" placeholder="Example: confirmed technical constraints, prior conclusions, key APIs, or approaches to avoid."></textarea>
              <small>{{ draft.projectMemory.length }} / 500</small>
            </label>
          </div>

          <footer class="session-config-footer">
            <p v-if="error" class="session-config-error" role="alert">{{ error }}</p>
            <div class="session-config-actions">
              <button type="submit" class="primary-action" :disabled="saving">
                <AppIcon name="check" :size="16" />
                <span>{{ saving ? 'Saving…' : 'Save Settings' }}</span>
              </button>
              <button type="button" class="secondary-action" :disabled="saving" @click="$emit('close')">Cancel</button>
            </div>
          </footer>
        </form>
      </section>
    </div>
  </Teleport>
</template>
