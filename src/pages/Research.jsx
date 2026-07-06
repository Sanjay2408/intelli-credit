import React, { useState } from 'react'
import { useStore } from '../lib/store.jsx'
import { runResearch } from '../lib/api.js'
import { PageHeader, ErrorBanner, Spinner, AlertCard } from '../components/ui.jsx'
import { Globe, Search, Loader2 } from 'lucide-react'

export default function Research() {
  const { company } = useStore()
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [custom, setCustom] = useState('')

  const run = async (query = '') => {
    if (!query && !company.name) { setError('Run an assessment first, or type a custom query below.'); return }
    setError('')
    setLoading(true)
    setResult(null)
    try {
      setResult(await runResearch(company.name, company.sector, query))
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  return (
    <div>
      <PageHeader title="Research Insights" subtitle="Live web intelligence — news, litigation, regulators, sector outlook">
        <button onClick={() => run()} disabled={loading || !company.name} className="btn-primary">
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Globe size={15} />}
          Research {company.name || 'company'}
        </button>
      </PageHeader>
      <ErrorBanner message={error} />

      <div className="card !p-3 flex gap-2 mb-6 fade-in">
        <input className="input !border-0 !ring-0 !shadow-none bg-transparent" placeholder="Custom web search — e.g. 'RBI penalties on NBFC gold loan companies 2025'"
          value={custom} onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && custom.trim() && run(custom.trim())} />
        <button onClick={() => custom.trim() && run(custom.trim())} disabled={loading} className="btn-secondary !px-5">
          <Search size={15} />
        </button>
      </div>

      {loading && <Spinner label="Searching the web and synthesizing risk insights…" />}

      {result && !loading && (
        <div className="space-y-6 fade-in">
          {result.summary && (
            <div className="card">
              <h3 className="font-semibold mb-2">Executive Summary</h3>
              <p className="text-[15px] leading-relaxed text-ink-soft">{result.summary}</p>
            </div>
          )}
          {(result.insights || []).length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Risk Insights</h3>
              <div className="grid md:grid-cols-2 gap-3">
                {result.insights.map((it, i) => (
                  <AlertCard key={i} severity={it.severity} title={`${it.category ? it.category + ' — ' : ''}${it.title}`} detail={it.detail} />
                ))}
              </div>
            </div>
          )}
          {result.raw_report && (
            <details className="card">
              <summary className="font-semibold cursor-pointer">Full research report</summary>
              <div className="text-sm leading-relaxed text-ink-soft whitespace-pre-line mt-3">{result.raw_report}</div>
            </details>
          )}
        </div>
      )}
    </div>
  )
}
