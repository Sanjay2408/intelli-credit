const BASE = '/api'

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Request failed')
  }
  return res.json()
}

export async function processDocument(file, docType = 'auto') {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('doc_type', docType)
  const res = await fetch(`${BASE}/documents/process`, { method: 'POST', body: fd })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Upload failed')
  }
  return res.json()
}

export const processText = (filename, text, docType = 'auto') =>
  post('/documents/process-text', { filename, text, doc_type: docType })
export const verifyIdentity = (companyName, pan, gstin) =>
  post('/verify', { company_name: companyName, pan, gstin })
export const queryDocuments = (question, chunks) => post('/query', { question, chunks })
export const extractForm = (chunks) => post('/assess/extract-form', { chunks })
export const runAssessment = (payload) => post('/assess', payload)
export const fetchCharts = (chunks, companyName) => post('/charts/financial', { chunks, company_name: companyName })
export const runSwot = (companyName, sector, chunks) => post('/swot', { company_name: companyName, sector, chunks })
export const validateGST = (chunks, companyName) => post('/gst/validate', { chunks, company_name: companyName })
export const runResearch = (companyName, sector, query = '') => post('/research', { company_name: companyName, sector, query })
export const generateCAM = (companyName, sector, assessment, chunks) =>
  post('/cam/generate', { company_name: companyName, sector, assessment, chunks })

export async function downloadCAMDocx(companyName, sector, assessment, chunks) {
  const res = await fetch(`${BASE}/cam/docx`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ company_name: companyName, sector, assessment, chunks }),
  })
  if (!res.ok) throw new Error('DOCX generation failed')
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `CAM_${companyName.replace(/[^A-Za-z0-9]+/g, '_')}.docx`
  a.click()
  URL.revokeObjectURL(url)
}
