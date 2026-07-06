import React, { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store.jsx'
import { processDocument, processText, extractForm, runAssessment, verifyIdentity } from '../lib/api.js'
import { canExtractInBrowser, extractTextInBrowser } from '../lib/extract.js'
import { PageHeader, ErrorBanner, SeverityBadge } from '../components/ui.jsx'
import {
  UploadCloud, FileText, FileSpreadsheet, FileImage, FileJson,
  File as FileIcon, X, Wand2, Loader2, CheckCircle2, ArrowRight,
  ShieldCheck, ShieldAlert, ShieldQuestion, Fingerprint,
} from 'lucide-react'

const ACCEPT = '.pdf,.csv,.tsv,.txt,.md,.json,.xlsx,.xlsm,.xls,.docx,.png,.jpg,.jpeg,.webp'
const SERVER_LIMIT = 3.8 * 1024 * 1024 // beyond this, extract in the browser

const iconFor = (name) => {
  const ext = name.split('.').pop().toLowerCase()
  if (['xlsx', 'xls', 'xlsm', 'csv', 'tsv'].includes(ext)) return FileSpreadsheet
  if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) return FileImage
  if (ext === 'json') return FileJson
  if (['pdf', 'docx', 'txt', 'md'].includes(ext)) return FileText
  return FileIcon
}

const VERDICT = {
  clear: { Icon: ShieldCheck, cls: 'text-emerald-600 bg-emerald-50 border-emerald-200', label: 'Verification clear' },
  caution: { Icon: ShieldAlert, cls: 'text-amber-600 bg-amber-50 border-amber-200', label: 'Caution advised' },
  red_flag: { Icon: ShieldAlert, cls: 'text-red-600 bg-red-50 border-red-200', label: 'Red flags found' },
  inconclusive: { Icon: ShieldQuestion, cls: 'text-ink-soft bg-black/[0.04] border-black/10', label: 'Inconclusive' },
}

function Step({ n, label, active, done }) {
  return (
    <div className={`flex items-center gap-2 ${active ? 'text-ink' : 'text-ink-faint'}`}>
      <span className={`w-6 h-6 rounded-full text-xs font-semibold flex items-center justify-center ${
        done ? 'bg-emerald-500 text-white' : active ? 'bg-accent text-white' : 'bg-black/[0.07]'
      }`}>{done ? '✓' : n}</span>
      <span className="text-sm font-medium hidden sm:inline">{label}</span>
    </div>
  )
}

export default function NewAssessment() {
  const {
    chunks, setChunks, documents, setDocuments, company, setCompany,
    setAssessment, addAssessmentToHistory, ids, setIds, verification, setVerification,
  } = useStore()
  const navigate = useNavigate()
  const fileRef = useRef()
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [assessing, setAssessing] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: company.name || '', sector: company.sector || '', loanCr: company.loanCr || '',
    revenue: '', profit: '', debt: '', gstin: '', notes: '',
  })

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const runVerification = async (name, pan, gstin) => {
    setVerifying(true)
    try {
      const v = await verifyIdentity(name || form.name, pan || '', gstin || '')
      setVerification(v)
    } catch (e) {
      setError(`Verification: ${e.message}`)
    }
    setVerifying(false)
  }

  const handleFiles = async (fileList) => {
    setError('')
    setUploading(true)
    let newPan = '', newGstin = '', newName = ''
    for (const file of Array.from(fileList)) {
      try {
        let res
        if (file.size > SERVER_LIMIT && canExtractInBrowser(file)) {
          setUploadStatus(`Extracting ${file.name} in your browser (${(file.size / 1048576).toFixed(1)} MB)…`)
          const text = await extractTextInBrowser(file)
          setUploadStatus(`Indexing ${file.name}…`)
          res = await processText(file.name, text)
        } else if (file.size > SERVER_LIMIT) {
          throw new Error('Files over ~4 MB of this type must be converted (e.g. save DOCX as PDF/TXT).')
        } else {
          setUploadStatus(`Processing ${file.name}…`)
          res = await processDocument(file)
        }
        setChunks((c) => [...c, ...res.chunks])
        setDocuments((d) => [...d, {
          filename: res.filename, doc_type_label: res.doc_type_label,
          num_chunks: res.num_chunks, company_name: res.company_name,
        }])
        if (res.company_name && !form.name) {
          newName = res.company_name
          setForm((f) => ({ ...f, name: f.name || res.company_name }))
        }
        if (res.gstins?.length && !form.gstin) setForm((f) => ({ ...f, gstin: f.gstin || res.gstins[0] }))
        setIds((prev) => {
          const pans = [...new Set([...prev.pans, ...(res.pans || [])])]
          const gstins = [...new Set([...prev.gstins, ...(res.gstins || [])])]
          if (!newPan && res.pans?.length) newPan = res.pans[0]
          if (!newGstin && res.gstins?.length) newGstin = res.gstins[0]
          return { pans, gstins }
        })
      } catch (e) {
        setError(`${file.name}: ${e.message}`)
      }
    }
    setUploading(false)
    setUploadStatus('')
    // Auto-verify externally as soon as a PAN/GSTIN is detected
    if ((newPan || newGstin) && !verification) {
      runVerification(newName || form.name, newPan, newGstin)
    }
  }

  const removeDoc = (filename) => {
    setDocuments((d) => d.filter((x) => x.filename !== filename))
    setChunks((c) => c.filter((x) => x.source !== filename))
  }

  const autoFill = async () => {
    setError('')
    setExtracting(true)
    try {
      const data = await extractForm(chunks)
      setForm((f) => ({
        ...f,
        name: data.company_name || f.name,
        sector: data.sector || f.sector,
        revenue: data.annual_revenue_cr ?? f.revenue,
        profit: data.net_profit_cr ?? f.profit,
        debt: data.total_debt_cr ?? f.debt,
        gstin: data.gstin || f.gstin,
      }))
    } catch (e) {
      setError(e.message)
    }
    setExtracting(false)
  }

  const submit = async () => {
    if (!form.name.trim()) { setError('Please enter a company name.'); return }
    if (chunks.length === 0) { setError('Please upload at least one document.'); return }
    setError('')
    setAssessing(true)
    try {
      const result = await runAssessment({
        company_name: form.name.trim(),
        sector: form.sector.trim(),
        requested_loan_cr: Number(form.loanCr) || 0,
        chunks,
        primary_insights: form.notes.trim(),
        annual_revenue_cr: form.revenue === '' ? null : Number(form.revenue),
        net_profit_cr: form.profit === '' ? null : Number(form.profit),
        total_debt_cr: form.debt === '' ? null : Number(form.debt),
        gstin: form.gstin.trim() || null,
      })
      setCompany({ name: form.name.trim(), sector: form.sector.trim(), loanCr: form.loanCr })
      setAssessment(result)
      addAssessmentToHistory(result, form.name.trim())
      navigate('/analysis')
    } catch (e) {
      setError(e.message)
    }
    setAssessing(false)
  }

  const hasIds = ids.pans.length > 0 || ids.gstins.length > 0
  const verdict = verification?.web_verification?.verdict
  const V = VERDICT[verdict] || VERDICT.inconclusive

  return (
    <div>
      <PageHeader
        title="New Credit Assessment"
        subtitle="Upload financial documents of any size — PDF, Excel, CSV, Word, text, JSON, or scanned images"
      />

      {/* Guided step indicator */}
      <div className="flex items-center gap-4 sm:gap-6 mb-8 fade-in">
        <Step n={1} label="Upload documents" done={documents.length > 0} active />
        <div className="h-px flex-1 bg-black/10" />
        <Step n={2} label="Identity verification" done={!!verification} active={documents.length > 0} />
        <div className="h-px flex-1 bg-black/10" />
        <Step n={3} label="Company details" done={!!form.name && chunks.length > 0} active={documents.length > 0} />
        <div className="h-px flex-1 bg-black/10" />
        <Step n={4} label="AI assessment" active={!!form.name && chunks.length > 0} />
      </div>

      <ErrorBanner message={error} />

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upload + verification panel */}
        <div className="space-y-4 fade-in">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }}
            onClick={() => fileRef.current?.click()}
            className={`card cursor-pointer text-center py-12 border-2 border-dashed transition-all ${
              dragging ? 'border-accent bg-accent-soft' : 'border-black/10 hover:border-accent/50'
            }`}
          >
            <input ref={fileRef} type="file" multiple accept={ACCEPT} className="hidden"
              onChange={(e) => { handleFiles(e.target.files); e.target.value = '' }} />
            <div className="w-14 h-14 mx-auto rounded-2xl bg-accent-soft flex items-center justify-center mb-4">
              {uploading ? <Loader2 className="animate-spin text-accent" size={24} /> : <UploadCloud className="text-accent" size={24} />}
            </div>
            <div className="font-semibold">{uploading ? (uploadStatus || 'Processing…') : 'Drop files here or click to browse'}</div>
            <div className="text-xs text-ink-faint mt-2">
              PDF · XLSX · CSV · DOCX · TXT · MD · JSON · PNG/JPG (OCR) — no size limit; large files are extracted in your browser
            </div>
          </div>

          {documents.length > 0 && (
            <div className="card !p-4 space-y-2">
              {documents.map((d) => {
                const Icon = iconFor(d.filename)
                return (
                  <div key={d.filename} className="flex items-center gap-3 rounded-xl bg-black/[0.03] px-3.5 py-2.5">
                    <Icon size={18} className="text-accent shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{d.filename}</div>
                      <div className="text-[11px] text-ink-faint">{d.doc_type_label} · {d.num_chunks} chunks indexed</div>
                    </div>
                    <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                    <button onClick={() => removeDoc(d.filename)} className="text-ink-faint hover:text-red-500 transition-colors">
                      <X size={15} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {/* Identity verification card */}
          {(hasIds || verifying || verification) && (
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2"><Fingerprint size={17} /> Identity Verification</h3>
                <button
                  onClick={() => runVerification(form.name, ids.pans[0], ids.gstins[0])}
                  disabled={verifying}
                  className="btn-secondary !px-4 !py-1.5 text-xs"
                >
                  {verifying ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={13} />}
                  {verification ? 'Re-verify' : 'Verify externally'}
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                {ids.pans.map((p) => (
                  <span key={p} className="text-xs font-mono bg-accent-soft text-accent rounded-full px-3 py-1">PAN {p}</span>
                ))}
                {ids.gstins.map((g) => (
                  <span key={g} className="text-xs font-mono bg-black/[0.05] rounded-full px-3 py-1">GSTIN {g}</span>
                ))}
                {!hasIds && <span className="text-xs text-ink-faint">No PAN/GSTIN detected in documents yet.</span>}
              </div>

              {verifying && (
                <div className="flex items-center gap-2 text-sm text-ink-soft py-2">
                  <Loader2 size={14} className="animate-spin" /> Checking MCA records, defaulter lists and public sources…
                </div>
              )}

              {verification && !verifying && (
                <div className="space-y-3">
                  {verification.structural_checks?.map((c, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      {c.result === 'valid'
                        ? <CheckCircle2 size={15} className="text-emerald-500 mt-0.5 shrink-0" />
                        : <ShieldAlert size={15} className="text-red-500 mt-0.5 shrink-0" />}
                      <span><b>{c.check}</b> ({c.value}): {c.detail}</span>
                    </div>
                  ))}
                  {verification.web_verification && (
                    <div className={`rounded-xl border p-4 ${V.cls}`}>
                      <div className="flex items-center gap-2 font-semibold text-sm mb-1.5">
                        <V.Icon size={16} /> {V.label}
                      </div>
                      <p className="text-sm opacity-90">{verification.web_verification.summary}</p>
                      {(verification.web_verification.findings || []).length > 0 && (
                        <div className="mt-3 space-y-2">
                          {verification.web_verification.findings.map((f, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm">
                              <SeverityBadge severity={f.severity} />
                              <span><b>{f.title}</b> — {f.detail}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <p className="text-[11px] text-ink-faint">{verification.disclaimer}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Company form */}
        <div className="card fade-in h-fit">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold">Company Details</h3>
            <button onClick={autoFill} disabled={chunks.length === 0 || extracting} className="btn-secondary !px-4 !py-1.5 text-xs">
              {extracting ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} />}
              Auto-fill from documents
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Company name *</label>
              <input className="input" value={form.name} onChange={set('name')} placeholder="e.g. Meridian Industries Ltd" />
            </div>
            <div>
              <label className="label">Sector</label>
              <input className="input" value={form.sector} onChange={set('sector')} placeholder="Manufacturing" />
            </div>
            <div>
              <label className="label">Requested loan (₹ Cr)</label>
              <input className="input" type="number" value={form.loanCr} onChange={set('loanCr')} placeholder="50" />
            </div>
            <div>
              <label className="label">Annual revenue (₹ Cr)</label>
              <input className="input" type="number" value={form.revenue} onChange={set('revenue')} placeholder="auto" />
            </div>
            <div>
              <label className="label">Net profit (₹ Cr)</label>
              <input className="input" type="number" value={form.profit} onChange={set('profit')} placeholder="auto" />
            </div>
            <div>
              <label className="label">Total debt (₹ Cr)</label>
              <input className="input" type="number" value={form.debt} onChange={set('debt')} placeholder="auto" />
            </div>
            <div>
              <label className="label">GSTIN</label>
              <input className="input" value={form.gstin} onChange={set('gstin')} placeholder="auto" />
            </div>
            <div className="col-span-2">
              <label className="label">Primary due-diligence notes</label>
              <textarea className="input min-h-[88px]" value={form.notes} onChange={set('notes')}
                placeholder="Site visit observations, management interviews, market feedback…" />
            </div>
          </div>
          <button onClick={submit} disabled={assessing || uploading} className="btn-primary w-full mt-6 !py-3">
            {assessing ? (<><Loader2 size={16} className="animate-spin" /> Running AI credit assessment…</>)
              : (<>Run AI Assessment <ArrowRight size={16} /></>)}
          </button>
        </div>
      </div>
    </div>
  )
}
