import React, { useState } from 'react'
import { useStore } from '../lib/store.jsx'
import { validateGST } from '../lib/api.js'
import { PageHeader, EmptyState, ErrorBanner, Spinner, AlertCard, Stat, fmtCr } from '../components/ui.jsx'
import { ReceiptText, Loader2, CheckCircle2, AlertTriangle, XCircle, HelpCircle } from 'lucide-react'

const STATUS = {
  consistent: { label: 'Consistent', Icon: CheckCircle2, cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  minor_mismatch: { label: 'Minor Mismatch', Icon: AlertTriangle, cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  major_mismatch: { label: 'Major Mismatch', Icon: XCircle, cls: 'bg-red-50 text-red-700 border-red-200' },
  insufficient_data: { label: 'Insufficient Data', Icon: HelpCircle, cls: 'bg-black/[0.04] text-ink-soft border-black/10' },
}

export default function GSTValidation() {
  const { company, chunks } = useStore()
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (chunks.length === 0) {
    return (
      <div>
        <PageHeader title="GST Cross-Validation" subtitle="GSTR vs bank statement vs books reconciliation" />
        <EmptyState detail="Upload GST returns, bank statements and financials to cross-validate turnover." />
      </div>
    )
  }

  const run = async () => {
    setError('')
    setLoading(true)
    try {
      setResult(await validateGST(chunks, company.name))
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  const s = result ? (STATUS[result.status] || STATUS.insufficient_data) : null

  return (
    <div>
      <PageHeader title="GST Cross-Validation" subtitle="Reconcile GST returns, bank credits and reported revenue">
        <button onClick={run} disabled={loading} className="btn-primary">
          {loading ? <Loader2 size={15} className="animate-spin" /> : <ReceiptText size={15} />}
          {result ? 'Re-validate' : 'Run validation'}
        </button>
      </PageHeader>
      <ErrorBanner message={error} />

      {loading && <Spinner label="Reconciling GST, bank and book figures…" />}

      {result && !loading && (
        <div className="space-y-6 fade-in">
          <div className={`card border flex items-center gap-4 ${s.cls}`}>
            <s.Icon size={30} />
            <div>
              <div className="text-lg font-semibold">{s.label}</div>
              {result.variance_pct != null && <div className="text-sm opacity-80">Turnover variance: {result.variance_pct}%</div>}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Stat label="GST Turnover" value={fmtCr(result.gst_turnover_cr)} />
            <Stat label="Bank Credits" value={fmtCr(result.bank_credits_cr)} />
            <Stat label="Books Revenue" value={fmtCr(result.books_revenue_cr)} />
          </div>
          {(result.findings || []).length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Findings</h3>
              <div className="grid md:grid-cols-2 gap-3">
                {result.findings.map((f, i) => (
                  <AlertCard key={i} severity={f.severity} title={f.title} detail={f.detail} />
                ))}
              </div>
            </div>
          )}
          {result.recommendation && (
            <div className="card">
              <h3 className="font-semibold mb-2">Recommendation</h3>
              <p className="text-[15px] leading-relaxed text-ink-soft">{result.recommendation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
