import React, { useState } from 'react'
import { useStore } from '../lib/store.jsx'
import { generateCAM, downloadCAMDocx } from '../lib/api.js'
import { PageHeader, EmptyState, ErrorBanner, Spinner } from '../components/ui.jsx'
import { ChevronDown, FileDown, FileText, Loader2, RefreshCw } from 'lucide-react'
import jsPDF from 'jspdf'

const TBV = (v) => !v || /to be verified|pending/i.test(v)

function SectionBody({ s }) {
  if (s.type === 'fields') {
    return (
      <table className="w-full text-sm">
        <tbody>
          {(s.fields || []).map((f, i) => (
            <tr key={i} className="border-t border-black/[0.05]">
              <td className="py-2.5 pr-4 font-medium text-ink-soft w-2/5 align-top">{f.label}</td>
              <td className={`py-2.5 align-top ${TBV(f.value) ? 'text-ink-faint italic' : ''}`}>{f.value || 'To be verified'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }
  if (s.type === 'risks') {
    return (
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-ink-faint">
            <th className="pb-2">Risk</th><th className="pb-2">Category</th><th className="pb-2">Mitigant</th>
          </tr>
        </thead>
        <tbody>
          {(s.risks || []).map((r, i) => (
            <tr key={i} className="border-t border-black/[0.05]">
              <td className="py-2.5 pr-4 align-top">{r.risk}</td>
              <td className="py-2.5 pr-4 align-top text-ink-soft">{r.category}</td>
              <td className="py-2.5 align-top text-ink-soft">{r.mitigant}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }
  if (s.type === 'list') {
    return (
      <ol className="space-y-2 list-none">
        {(s.items || []).map((item, i) => (
          <li key={i} className="flex gap-3 text-sm text-ink-soft">
            <span className="w-5 h-5 rounded-full bg-accent-soft text-accent text-[11px] font-semibold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
            {item}
          </li>
        ))}
      </ol>
    )
  }
  return <div className="text-[15px] leading-relaxed text-ink-soft whitespace-pre-line">{s.content}</div>
}

export default function CAMReport() {
  const { assessment, setAssessment, company, chunks } = useStore()
  const [loading, setLoading] = useState(false)
  const [docxLoading, setDocxLoading] = useState(false)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(0)
  const sections = assessment?.cam_sections || []

  if (!assessment) {
    return (
      <div>
        <PageHeader title="CAM Report" subtitle="Credit Appraisal Memorandum — bank template format" />
        <EmptyState title="No assessment yet" detail="Run a credit assessment first, then generate the CAM." />
      </div>
    )
  }

  const generate = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await generateCAM(company.name, company.sector, assessment, chunks)
      setAssessment({ ...assessment, cam_sections: res.sections || [] })
      setOpen(0)
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  const exportPDF = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' })
    const W = doc.internal.pageSize.getWidth()
    const margin = 56
    let y = 64
    const ensure = (need = 20) => { if (y > 800 - need) { doc.addPage(); y = 64 } }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.setTextColor('#0b1f3a')
    doc.text('CREDIT APPRAISAL MEMORANDUM', margin, y); y += 24
    doc.setFontSize(11); doc.setTextColor('#333')
    doc.text(`Name of the Applicant: ${company.name}    Sector: ${company.sector || '—'}`, margin, y); y += 16
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10)
    doc.text(
      `AI Risk Score: ${assessment.risk_score}/100 (${assessment.risk_band})   Decision: ${assessment.decision}   ` +
      `Recommended: Rs ${assessment.recommended_loan_cr ?? '—'} Cr @ ${assessment.interest_rate_pct ?? '—'}% for ${assessment.tenor_months ?? '—'} months`,
      margin, y,
    ); y += 26
    const writeWrapped = (text, x, width, size = 10, style = 'normal') => {
      doc.setFont('helvetica', style); doc.setFontSize(size)
      const lines = doc.splitTextToSize(String(text ?? ''), width)
      for (const line of lines) { ensure(); doc.text(line, x, y); y += size * 1.35 }
    }
    for (const s of sections) {
      ensure(40)
      doc.setFont('helvetica', 'bold'); doc.setFontSize(12.5); doc.setTextColor('#0b1f3a')
      doc.text(s.title, margin, y); y += 16
      doc.setTextColor('#222')
      if (s.type === 'fields') {
        for (const f of s.fields || []) {
          ensure()
          const startY = y
          writeWrapped(f.label, margin, 190, 9.5, 'bold')
          const afterLabel = y
          y = startY
          writeWrapped(f.value || 'To be verified', margin + 200, W - margin * 2 - 200, 9.5)
          y = Math.max(y, afterLabel) + 3
        }
      } else if (s.type === 'risks') {
        for (const r of s.risks || []) {
          writeWrapped(`• [${r.category}] ${r.risk}`, margin, W - margin * 2, 9.5, 'bold')
          writeWrapped(`   Mitigant: ${r.mitigant}`, margin, W - margin * 2, 9.5)
          y += 4
        }
      } else if (s.type === 'list') {
        (s.items || []).forEach((item, i) => writeWrapped(`${i + 1}. ${item}`, margin, W - margin * 2, 9.5))
      } else {
        writeWrapped(s.content, margin, W - margin * 2)
      }
      y += 14
    }
    doc.save(`CAM_${company.name.replace(/[^A-Za-z0-9]+/g, '_')}.pdf`)
  }

  const exportDocx = async () => {
    setDocxLoading(true)
    setError('')
    try {
      await downloadCAMDocx(company.name, company.sector, assessment, chunks)
    } catch (e) {
      setError(e.message)
    }
    setDocxLoading(false)
  }

  return (
    <div>
      <PageHeader title="CAM Report" subtitle={`Credit Appraisal Memorandum — ${company.name}`}>
        <div className="flex gap-2">
          {sections.length > 0 && (
            <>
              <button onClick={exportPDF} className="btn-secondary"><FileDown size={15} /> PDF</button>
              <button onClick={exportDocx} disabled={docxLoading} className="btn-secondary">
                {docxLoading ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />} DOCX
              </button>
            </>
          )}
          <button onClick={generate} disabled={loading} className="btn-primary">
            {loading ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
            {sections.length > 0 ? 'Regenerate' : 'Generate CAM'}
          </button>
        </div>
      </PageHeader>
      <ErrorBanner message={error} />

      {loading && <Spinner label="Filling the bank CAM template from your documents…" />}

      {!loading && sections.length === 0 && (
        <div className="card text-center py-16 fade-in">
          <p className="text-ink-soft max-w-lg mx-auto">
            Click <b>Generate CAM</b> to fill the standard bank Credit Appraisal Memorandum template —
            applicant details, verification checklist, compliances, financial comments, ratio analysis,
            risks & mitigants, and committee decision — from your uploaded documents. Fields without
            documentary evidence are marked <i>“To be verified”</i>.
          </p>
        </div>
      )}

      {!loading && sections.length > 0 && (
        <div className="space-y-3 fade-in">
          {sections.map((s, i) => (
            <div key={i} className="card !p-0 overflow-hidden">
              <button onClick={() => setOpen(open === i ? -1 : i)}
                className="w-full flex items-center justify-between px-6 py-4 text-left">
                <span className="font-semibold">{s.title}</span>
                <ChevronDown size={17} className={`text-ink-faint transition-transform ${open === i ? 'rotate-180' : ''}`} />
              </button>
              {open === i && <div className="px-6 pb-6"><SectionBody s={s} /></div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
