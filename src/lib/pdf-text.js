import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

const MAX_EXTRACTED_CHARACTERS = 120000

function pageText(items) {
  let result = ''
  for (const item of items || []) {
    if (typeof item?.str !== 'string') continue
    result += item.str
    result += item.hasEOL ? '\n' : ' '
  }
  return result.replace(/[ \t]+\n/g, '\n').replace(/[ \t]{2,}/g, ' ').trim()
}

export async function extractPdfText(file) {
  const { GlobalWorkerOptions, getDocument } = await import('pdfjs-dist')
  GlobalWorkerOptions.workerSrc = pdfWorkerUrl
  const bytes = new Uint8Array(await file.arrayBuffer())
  const document = await getDocument({ data: bytes }).promise
  const pageCount = document.numPages
  const pages = []

  try {
    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
      const page = await document.getPage(pageNumber)
      const content = await page.getTextContent()
      const text = pageText(content.items)
      if (text) pages.push(`--- 第 ${pageNumber} 页 ---\n${text}`)
      if (pages.join('\n\n').length >= MAX_EXTRACTED_CHARACTERS) break
    }
  } finally {
    await document.destroy()
  }

  const text = pages.join('\n\n').slice(0, MAX_EXTRACTED_CHARACTERS).trim()
  if (!text) {
    throw new Error(`${file.name} 未检测到可提取文字；如果是扫描版 PDF，请先进行 OCR。`)
  }
  return {
    text,
    pageCount,
    truncated: text.length >= MAX_EXTRACTED_CHARACTERS,
  }
}
