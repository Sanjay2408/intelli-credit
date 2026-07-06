import React, { useState } from 'react'
import { useStore } from '../lib/store.jsx'
import { generateCAM, downloadCAMDocx } from '../lib/api.js'
import { PageHeader, EmptyState, ErrorBanner, Spinner } from '../components/ui.jsx'
import { ChevronDown, FileDown, FileText, Loader2, RefreshCw } from 'lucide-react'
import jsPDF from 'jspdf'

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
        <PageHeader title="CAM Report" subtitle="Comprehensive Credit Appraisal Memo" />
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
    doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.setTextColor('#0b1f3a')
    doc.text('Credit Appraisal Memo', margin, y); y += 26
    doc.setFontSize(11); doc.setTextColor('#333')
    doc.text(`Company: ${company.name}    Sector: ${company.sector || '—'}`, margin, y); y += 16
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10)
    doc.text(
      `Risk Score: ${assessment.risk_score}/100 (${assessment.risk_band})   Decision: ${assessment.decision}   ` +
      `Recommended: Rs ${assessment.recommended_loan_cr ?? '—'} Cr @ ${assessment.interest_rate_pct ?? '—'}% for ${assessment.tenor_months ?? '—'} months`,
      margin, y,
    ); y += 26
    for (const s of sections) {
      if (y > 760) { doc.addPage(); y = 64 }
      doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor('#0b1f3a')
      doc.text(s.title, margin, y); y += 16
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor('#222')
      const lines = doc.splitTextToSize(s.content, W - margin * 2)
      for (const line of lines) {
        if (y > 780) { doc.addPage(); y = 64 }
        doc.text(line, margin, y); y += 13.5
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
      <PageHeader title="CAM Report" subtitle={`Credit Appraisal Memo — ${company.name}`}>
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

      {loading && <Spinner label="Drafting the Credit Appraisal Memo…" />}

      {!loading && sections.length === 0 && (
        <div className="card text-center py-16 fade-in">
          <p className="text-ink-soft">Click <b>Generate CAM</b> to draft a bank-grade appraisal memo from the assessment and documents.</p>
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
              {open === i && (
                <div className="px-6 pb-6 text-[15px] leading-relaxed text-ink-soft whitespace-pre-line">{s.content}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
