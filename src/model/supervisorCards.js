export function normalizeCardTitle(value, fallback = 'Turn Progress Summary') {
  const cleaned = String(value || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/^\s*#{1,6}\s*/g, '')
    .replace(/[*_`~]/g, '')
    .replace(/^\s*(?:okay|ok|sure|understood|got it|received|yes)[,:\s-]*/i, '')
    .replace(/[.;:\s]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return (cleaned || fallback).slice(0, 64)
}

export function repairCardTitle(value, body = '') {
  const original = String(value || '').trim()
  const cleaned = normalizeCardTitle(original)
  const combined = `${original} ${body}`.toLowerCase()
  if (/^(?:ok(?:ay)?[,:\s]*)?change.+format[.;:\s]*$/i.test(original)) {
    if (/pilot/.test(combined) && /student/.test(combined) && /teacher/.test(combined)) {
      return 'Student-Led Pilot Collaboration'
    }
    if (/pilot/.test(combined)) return 'Pilot Plan Key Discussion'
  }
  return cleaned
}

function normalizePartIDs(value) {
  if (!Array.isArray(value)) return []
  return [...new Set(value.filter((id) => typeof id === 'string' && id.trim()).map((id) => id.trim()))]
}

export function buildArtifactFallbackCard(turnMessages, sourceParts) {
  const assistantText = [...(turnMessages || [])]
    .reverse()
    .find((message) => message?.role === 'assistant' && typeof message.text === 'string')
    ?.text || ''
  const artifact = assistantText.match(
    /<contextpilot-artifact(?:\s+filename="([^"]+)")?\s*>([\s\S]*?)<\/contextpilot-artifact>/i,
  )
  if (!artifact) return null

  const filename = String(artifact[1] || '').trim()
  const markdown = String(artifact[2] || '').trim()
  const heading = markdown.match(/^\s*#\s+(.+)$/m)?.[1]?.trim()
  const title = normalizeCardTitle(heading || filename.replace(/\.md$/i, ''), 'Markdown Document Summary')
  const plainText = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+[.)]\s+/gm, '')
    .replace(/[|*_>`~]/g, ' ')
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
  const body = plainText.length > 220 ? `${plainText.slice(0, 220).trim()}…` : plainText
  const scope = `${title} ${plainText}`.toLowerCase()
  const category = /experiment|participant|variable|validation|research question/.test(scope)
    ? 'Study Design'
    : /paper|literature|survey|review/.test(scope)
      ? 'Literature Review'
      : /plan|design|prototype|system|product/.test(scope)
        ? 'Product Design'
        : 'Document Summary'

  return {
    id: '',
    topic: title,
    category,
    title,
    body: body || `Generated document ${filename || title}; more details are pending.`,
    partIDs: normalizePartIDs((sourceParts || []).map((part) => part.partID)),
  }
}

function plainSummary(text, limit = 220) {
  const plainText = String(text || '')
    .replace(/<contextpilot-artifact(?:\s+filename="[^"]*")?\s*>/gi, ' ')
    .replace(/<\/contextpilot-artifact>/gi, ' ')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+[.)]\s+/gm, '')
    .replace(/[|*_>`~]/g, ' ')
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
  return plainText.length > limit ? `${plainText.slice(0, limit).trim()}…` : plainText
}

function inferCategory(text) {
  const value = String(text || '').toLowerCase()
  if (/direction|product|plan|design|prototype|mvp|system/.test(value)) return 'Product Design'
  if (/experiment|participant|variable|validation|interview|research question/.test(value)) return 'Study Design'
  if (/paper|literature|survey|review/.test(value)) return 'Literature Review'
  if (/error|failure|bug|issue|fault/.test(value)) return 'Issue Analysis'
  return 'Progress'
}

function fallbackTitle(userText, assistantText, direction) {
  if (direction) return `Direction ${direction} Design Plan`

  const combined = `${userText}\n${assistantText}`.toLowerCase()
  if (/pilot/.test(combined) && /student/.test(combined) && /teacher/.test(combined)) {
    return 'Student-Led Pilot Collaboration'
  }
  if (/pilot/.test(combined)) return 'Pilot Plan Key Discussion'

  const sectionQuestion = assistantText.match(
    /(?:^|\n)\s*(?:[-—]{2,}\s*)?(?:Q\s*\d+|question\s*\d+)[.:\s-]+([^\n?]{4,60})/i,
  )?.[1]
  if (sectionQuestion) return normalizeCardTitle(sectionQuestion)

  const heading = assistantText.match(/^\s*#{1,3}\s+(.{4,88})$/m)?.[1]
  if (heading) return normalizeCardTitle(heading)

  const request = String(userText || '')
    .replace(/^\s*(?:ok(?:ay)?|now|next|please|help me|i want|i need)[,:\s]*/i, '')
    .replace(/(?:output|generate|organize|write|explain|discuss)(?:\s+(?:this|a|an))?/gi, '')
    .replace(/[.!?]+$/g, '')
    .trim()
  return normalizeCardTitle(request, 'Turn Progress Summary')
}

export function buildTurnFallbackCard(turnMessages, sourceParts) {
  const artifactCard = buildArtifactFallbackCard(turnMessages, sourceParts)
  if (artifactCard) return artifactCard

  const messages = Array.isArray(turnMessages) ? turnMessages : []
  const userText = [...messages].reverse().find((message) => message?.role === 'user')?.text || ''
  const assistantText = [...messages].reverse().find((message) => message?.role === 'assistant')?.text || ''
  const body = plainSummary(assistantText)
  const partIDs = normalizePartIDs((sourceParts || []).map((part) => part.partID))
  if (!partIDs.length || body.length < 80) return null

  const direction = `${userText}\n${assistantText}`.match(/direction\s*([A-Za-z0-9]+)/i)?.[1]
  const title = fallbackTitle(userText, assistantText, direction)

  return {
    id: '',
    topic: title,
    category: inferCategory(`${userText} ${assistantText}`),
    title,
    body,
    partIDs,
  }
}
