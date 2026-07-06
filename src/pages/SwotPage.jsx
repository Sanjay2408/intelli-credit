import React, { useState } from 'react'
import { useStore } from '../lib/store.jsx'
import { runSwot } from '../lib/api.js'
import { PageHeader, EmptyState, ErrorBanner, Spinner } from '../components/ui.jsx'
import { TrendingUp, TrendingDown, Lightbulb, ShieldAlert, Loader2, Grid2x2 } from 'lucide-react'

const QUADRANTS = [
  ['strengths', 'Strengths', TrendingUp, 'bg-emerald-50 border-emerald-100', 'text-emerald-600'],
  ['weaknesses', 'Weaknesses', TrendingDown, 'bg-red-50 border-red-100', 'text-red-600'],
  ['opportunities', 'Opportunities', Lightbulb, 'bg-sky-50 border-sky-100', 'text-sky-600'],
  ['threats', 'Threats', ShieldAlert, 'bg-amber-50 border-amber-100', 'text-amber-600'],
]

export default function SwotPage() {
  const { company, chunks } = useStore()
  const [swot, setSwot] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (chunks.length === 0) {
    return (
      <div>
        <PageHeader title="SWOT Analysis" subtitle="AI-generated, grounded in your documents" />
        <EmptyState detail="Upload documents in a new assessment to generate a SWOT analysis." />
      </div>
    )
  }

  const run = async () => {
    setError('')
    setLoading(true)
    try {
      setSwot(await runSwot(company.name || 'the company', company.sector, chunks))
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  return (
    <div>
      <PageHeader title="SWOT Analysis" subtitle={`Sector-aware SWOT for ${company.name || 'your company'}`}>
        <button onClick={run} disabled={loading} className="btn-primary">
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Grid2x2 size={15} />}
          {swot ? 'Regenerate' : 'Generate SWOT'}
        </button>
      </PageHeader>
      <ErrorBanner message={error} />

      {loading && <Spinner label="Analyzing strengths, weaknesses, opportunities & threats…" />}

      {swot && !loading && (
        <div className="fade-in">
          {swot.summary && (
            <div className="card mb-4">
              <p className="text-[15px] leading-relaxed text-ink-soft">{swot.summary}</p>
            </div>
          )}
          <div className="grid md:grid-cols-2 gap-4">
            {QUADRANTS.map(([key, label, Icon, bg, fg]) => (
              <div key={key} className={`card border ${bg}`}>
                <h3 className={`font-semibold flex items-center gap-2 mb-3 ${fg}`}>
                  <Icon size={17} /> {label}
                </h3>
                <ul className="space-y-2.5">
                  {(swot[key] || []).map((item, i) => (
                    <li key={i} className="text-sm text-ink-soft leading-relaxed flex gap-2">
                      <span className={`mt-[7px] w-1.5 h-1.5 rounded-full shrink-0 ${fg.replace('text-', 'bg-')}`} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
