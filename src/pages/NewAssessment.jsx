import React, { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store.jsx'
import { processDocument, extractForm, runAssessment } from '../lib/api.js'
import { PageHeader, ErrorBanner } from '../components/ui.jsx'
import {
  UploadCloud, FileText, FileSpreadsheet, FileImage, FileJson,
  File as FileIcon, X, Wand2, Loader2, CheckCircle2, ArrowRight,
} from 'lucide-react'

const ACCEPT = '.pdf,.csv,.tsv,.txt,.md,.json,.xlsx,.xlsm,.xls,.docx,.png,.jpg,.jpeg,.webp'

const iconFor = (name) => {
  const ext = name.split('.').pop().toLowerCase()
  if (['xlsx', 'xls', 'xlsm', 'csv', 'tsv'].includes(ext)) return FileSpreadsheet
  if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) return FileImage
  if (ext === 'json') return FileJson
  if (['pdf', 'docx', 'txt', 'md'].includes(ext)) return FileText
  return FileIcon
}

export default function NewAssessment() {
  const { chunks, setChunks, documents, setDocuments, company, setCompany, setAssessment, addAssessmentToHistory } = useStore()
  const navigate = useNavigate()
  const fileRef = useRef()
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [assessing, setAssessing] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: company.name || '', sector: company.sector || '', loanCr: company.loanCr || '',
    revenue: '', profit: '', debt: '', gstin: '', notes: '',
  })

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleFiles = async (fileList) => {
    setError('')
    setUploading(true)
    for (const file of Array.from(fileList)) {
      try {
        const res = await processDocument(file)
        setChunks((c) => [...c, ...res.chunks])
        setDocuments((d) => [...d, {
          filename: res.filename, doc_type_label: res.doc_type_label,
          num_chunks: res.num_chunks, company_name: res.company_name,
        }])
        if (res.company_name && !form.name) setForm((f) => ({ ...f, name: res.company_name }))
      } catch (e) {
        setError(`${file.name}: ${e.message}`)
      }
    }
    setUploading(false)
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

  return (
    <div>
      <PageHeader
        title="New Credit Assessment"
        subtitle="Upload any financial documents — PDF, Excel, CSV, Word, text, JSON, or scanned images"
      />
      <ErrorBanner message={error} />

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upload panel */}
        <div className="space-y-4 fade-in">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }}
            onClick={() => fileRef.current?.click()}
            className={`card cursor-pointer text-center py-14 border-2 border-dashed transition-all ${
              dragging ? 'border-accent bg-accent-soft' : 'border-black/10 hover:border-accent/50'
            }`}
          >
            <input ref={fileRef} type="file" multiple accept={ACCEPT} className="hidden"
              onChange={(e) => { handleFiles(e.target.files); e.target.value = '' }} />
            <div className="w-14 h-14 mx-auto rounded-2xl bg-accent-soft flex items-center justify-center mb-4">
              {uploading ? <Loader2 className="animate-spin text-accent" size={24} /> : <UploadCloud className="text-accent" size={24} />}
            </div>
            <div className="font-semibold">{uploading ? 'Processing & classifying…' : 'Drop files here or click to browse'}</div>
            <div className="text-xs text-ink-faint mt-2">
              PDF · XLSX · CSV · DOCX · TXT · MD · JSON · PNG/JPG (OCR) — max 4 MB each
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
        </div>

        {/* Company form */}
        <div className="card fade-in">
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
