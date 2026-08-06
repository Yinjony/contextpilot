// 轻量级 ElMessage 风格通知（项目未引入 element-plus，这里提供一个 API 兼容的最小实现）。
// 用法与 Element Plus 一致：
//   ElMessage('提示文字')
//   ElMessage({ message: '尚未连接 opencode', type: 'warning', duration: 3000 })
//   ElMessage.warning('…') / ElMessage.success('…') / ElMessage.error('…') / ElMessage.info('…')

const STYLE_ID = 'contextpilot-el-message-style'
const CONTAINER_ID = 'contextpilot-el-message-container'

const TYPE_THEME = {
  success: { color: '#67c23a', icon: '<path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/>' },
  warning: { color: '#e6a23c', icon: '<path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>' },
  error: { color: '#f56c6c', icon: '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>' },
  info: { color: '#909399', icon: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>' },
}

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
.ctx-msg-container {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  pointer-events: none;
}
.ctx-msg {
  pointer-events: auto;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  max-width: min(86vw, 520px);
  padding: 9px 16px;
  border-radius: 6px;
  background: #ffffff;
  color: #303133;
  font-size: 14px;
  line-height: 1.5;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.04);
  font-family: inherit;
  transform: translateY(-12px);
  opacity: 0;
  transition: transform 0.28s ease, opacity 0.28s ease;
}
.ctx-msg.ctx-msg-show {
  transform: translateY(0);
  opacity: 1;
}
.ctx-msg-icon {
  flex: 0 0 auto;
  display: inline-flex;
}
.ctx-msg-text {
  flex: 1;
  min-width: 0;
  word-break: break-word;
}
.ctx-msg-close {
  flex: 0 0 auto;
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: 4px;
  border: 0;
  padding: 0;
  border-radius: 50%;
  background: transparent;
  color: #c0c4cc;
  cursor: pointer;
  transition: color 0.15s ease, background 0.15s ease;
}
.ctx-msg-close:hover {
  color: #909399;
  background: rgba(0, 0, 0, 0.05);
}
@media (prefers-color-scheme: dark) {
  .ctx-msg { background: #2c2c2e; color: #f1f1f3; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.06); }
  .ctx-msg-close { color: #6b6b70; }
  .ctx-msg-close:hover { color: #9a9aa0; background: rgba(255, 255, 255, 0.08); }
}
`
  document.head.appendChild(style)
}

function ensureContainer() {
  ensureStyles()
  let container = document.getElementById(CONTAINER_ID)
  if (!container) {
    container = document.createElement('div')
    container.id = CONTAINER_ID
    container.className = 'ctx-msg-container'
    document.body.appendChild(container)
  }
  return container
}

function iconSvg(color, path) {
  return `<svg class="ctx-msg-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`
}

function closeSvg() {
  return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`
}

function showToast({ type = 'info', message = '', duration = 3000, showClose = false }) {
  if (typeof document === 'undefined') return { close() {} }
  const theme = TYPE_THEME[type] || TYPE_THEME.info
  const container = ensureContainer()

  const el = document.createElement('div')
  el.className = 'ctx-msg'
  el.setAttribute('role', type === 'error' || type === 'warning' ? 'alert' : 'status')
  el.innerHTML = `${iconSvg(theme.color, theme.icon)}<span class="ctx-msg-text"></span>`
  el.querySelector('.ctx-msg-text').textContent = String(message)

  let timer = null
  const dismiss = () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    el.classList.remove('ctx-msg-show')
    setTimeout(() => el.remove(), 300)
  }

  if (showClose) {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'ctx-msg-close'
    btn.setAttribute('aria-label', '关闭')
    btn.innerHTML = closeSvg()
    btn.addEventListener('click', dismiss)
    el.appendChild(btn)
  }

  container.appendChild(el)
  // 下一帧加上 show 类，触发滑入过渡。
  requestAnimationFrame(() => el.classList.add('ctx-msg-show'))

  if (duration > 0) timer = setTimeout(dismiss, duration)

  return { close: dismiss }
}

export function ElMessage(options) {
  const opts = typeof options === 'string' ? { message: options } : options || {}
  return showToast({
    type: opts.type || 'info',
    message: opts.message || '',
    duration: opts.duration ?? 3000,
    showClose: Boolean(opts.showClose),
  })
}

;['success', 'warning', 'error', 'info'].forEach((type) => {
  ElMessage[type] = (message, options = {}) =>
    ElMessage({ ...(typeof message === 'object' && message !== null ? message : { message }), ...options, type })
})

export default ElMessage
