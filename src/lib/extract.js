// Client-side text extraction — removes the serverless 4 MB upload cap by
// sending extracted text instead of raw bytes for large files.

const TEXT_EXTS = ['txt', 'md', 'log', 'text', 'json', 'csv', 'tsv']
export const CLIENT_EXTRACT_EXTS = ['pdf', 'xlsx', 'xlsm', 'xls', ...TEXT_EXTS]

export const ext = (name) => (name.includes('.') ? name.split('.').pop().toLowerCase() : '')

export function canExtractInBrowser(file) {
  return CLIENT_EXTRACT_EXTS.includes(ext(file.name))
}

async function extractPdf(file) {
  const pdfjs = await import('pdfjs-dist')
  const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise
  const pages = []
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const content = await page.getTextContent()
    pages.push(content.items.map((it) => it.str).join(' '))
  }
  return pages.join('\n\n')
}

async function extractXlsx(file) {
  const XLSX = await import('xlsx')
  const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' })
  const out = []
  for (const name of wb.SheetNames) {
    out.push(`## Sheet: ${name}`)
    out.push(XLSX.utils.sheet_to_csv(wb.Sheets[name]))
  }
  return out.join('\n')
}

export async function extractTextInBrowser(file) {
  const e = ext(file.name)
  if (e === 'pdf') return extractPdf(file)
  if (['xlsx', 'xlsm', 'xls'].includes(e)) return extractXlsx(file)
  if (TEXT_EXTS.includes(e)) return file.text()
  throw new Error(`Cannot extract .${e} in the browser`)
}
