<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import AppIcon from './AppIcon.vue'

const props = defineProps({
  sessions: { type: Array, required: true },
  activeId: { type: String, default: '' },
  collapsed: { type: Boolean, default: false },
  projects: { type: Array, default: () => [] },
  activeProjectDirectory: { type: String, default: '' },
  projectLoading: { type: Boolean, default: false },
})

const emit = defineEmits([
  'select',
  'create',
  'share',
  'rename',
  'delete',
  'collapse',
  'expand',
  'configure',
  'workflow',
  'migrate',
  'select-project',
  'create-project',
  'remove-project',
])

const openMenuId = ref('')
const projectMenu = ref(null)
const projectMenuRef = ref(null)

const activeProject = computed(() =>
  props.projects.find((project) => project.directory === props.activeProjectDirectory) || props.projects[0] || null,
)

function projectInitials(project) {
  return String(project?.name || '').trim().slice(0, 2).toUpperCase() || 'CP'
}

function closeMenus() {
  openMenuId.value = ''
  projectMenu.value = null
}

function toggleMenu(id) {
  openMenuId.value = openMenuId.value === id ? '' : id
  projectMenu.value = null
}

function selectSession(id) {
  closeMenus()
  emit('select', id)
}

function runAction(type, id) {
  closeMenus()
  emit(type, id)
}

function selectProject(directory) {
  closeMenus()
  emit('select-project', directory)
}

// 右键项目环境头像：弹出“从侧边栏移除”菜单。
function openProjectMenu(event, directory) {
  event.preventDefault()
  openMenuId.value = ''
  projectMenu.value = { x: event.clientX, y: event.clientY, directory }
}

function removeProject() {
  const directory = projectMenu.value?.directory
  closeMenus()
  if (directory) emit('remove-project', directory)
}

function handleDocumentClick(event) {
  if (projectMenu.value && !projectMenuRef.value?.contains(event.target)) projectMenu.value = null
  openMenuId.value = ''
}

function handleKeydown(event) {
  if (event.key === 'Escape') closeMenus()
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <aside class="sidebar" :class="{ collapsed }" aria-label="sidebar">
    <button
      v-if="collapsed"
      type="button"
      class="rail-toggle"
      aria-label="expand sidebar"
      @click="$emit('expand')"
    >
      <span class="rail-content-icon"><AppIcon name="layers" :size="18" /></span>
      <AppIcon name="chevrons-right" :size="18" />
    </button>

    <template v-else>
      <nav class="project-rail" aria-label="project environments">
        <button
          type="button"
          class="project-rail-add"
          title="Choose project folder"
          aria-label="Choose a project folder and add it as an environment"
          :disabled="projectLoading"
          @click="$emit('create-project')"
        >
          <AppIcon name="plus" :size="17" />
        </button>
        <button
          v-for="project in projects"
          :key="project.directory"
          type="button"
          class="project-rail-item"
          :class="{ active: project.directory === activeProjectDirectory }"
          :title="project.directory"
          :aria-label="project.name"
          @click="selectProject(project.directory)"
          @contextmenu="openProjectMenu($event, project.directory)"
        >
          {{ projectInitials(project) }}
        </button>
      </nav>

      <div class="sidebar-content">
        <div class="sidebar-header">
          <div class="project-heading">
            <span class="project-heading-label">Project Environment</span>
            <strong :title="activeProject?.directory">{{ activeProject?.name || 'Project' }}</strong>
          </div>
          <span v-if="projectLoading" class="project-loading" aria-label="loading"></span>
          <button
            type="button"
            class="icon-btn"
            aria-label="collapse sidebar"
            @click="$emit('collapse')"
          >
            <AppIcon name="chevrons-left" :size="16" />
          </button>
        </div>

        <nav class="quick-actions" aria-label="Quick actions">
          <button type="button" class="create-action" @click="$emit('create')">
            <AppIcon name="plus" :size="16" />
            <span>New Chat</span>
          </button>
        </nav>

        <section class="session-list" aria-label="Chat list">
          <div class="section-heading">
            <span>Chats</span>
            <strong>{{ sessions.length }}</strong>
          </div>
          <p v-if="!sessions.length" class="project-empty">No chats in this project yet</p>
          <div
            v-for="session in sessions"
            :key="session.id"
            class="session-item"
            :class="{ active: session.id === activeId }"
            @click.stop
          >
            <button
              type="button"
              class="session-main"
              :title="session.title"
              @click="selectSession(session.id)"
            >
              <strong>{{ session.title }}</strong>
              <em>{{ session.time }}</em>
            </button>

            <div class="session-actions">
              <button
                type="button"
                class="session-menu-trigger"
                :aria-label="`${session.title} actions`"
                :aria-expanded="openMenuId === session.id"
                @click.stop="toggleMenu(session.id)"
              >
                <AppIcon name="more-horizontal" :size="18" />
              </button>

              <div v-if="openMenuId === session.id" class="session-menu" role="menu" @click.stop>
                <button type="button" role="menuitem" @click="runAction('share', session.id)">
                  <AppIcon name="share" :size="17" />
                  <span>Share</span>
                </button>
                <button type="button" role="menuitem" @click="runAction('rename', session.id)">
                  <AppIcon name="pencil" :size="17" />
                  <span>Rename</span>
                </button>
                <button type="button" class="danger" role="menuitem" @click="runAction('delete', session.id)">
                  <AppIcon name="trash" :size="17" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        <div class="sidebar-footer-actions" aria-label="session utilities">
          <button type="button" class="sidebar-utility-action" @click="$emit('configure')">
            <AppIcon name="sliders" :size="16" />
            <span>Conversation Settings</span>
          </button>
          <button type="button" class="sidebar-utility-action" @click="$emit('workflow')">
            <AppIcon name="workflow" :size="16" />
            <span>Execution Trace</span>
          </button>
          <button type="button" class="sidebar-utility-action" @click="$emit('migrate')">
            <AppIcon name="file-text" :size="16" />
            <span>Export Handoff</span>
          </button>
        </div>
      </div>

      <div
        v-if="projectMenu"
        ref="projectMenuRef"
        class="project-context-menu"
        :style="{ top: `${projectMenu.y}px`, left: `${projectMenu.x}px` }"
        role="menu"
        @click.stop
      >
        <button type="button" role="menuitem" @click="removeProject">
          <AppIcon name="x" :size="15" />
          <span>Remove from sidebar</span>
        </button>
      </div>
    </template>
  </aside>
</template>
