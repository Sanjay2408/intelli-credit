import React from 'react'
import { Link } from 'react-router-dom'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts'
import { useStore } from '../lib/store.jsx'
import { PageHeader, EmptyState, Stat } from '../components/ui.jsx'
import { BadgeCheck, AlertTriangle, XCircle, ArrowRight, ListChecks } from 'lucide-react'

const DECISION = {
  approved: { label: 'Approved', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', Icon: BadgeCheck },
  conditional: { label: 'Conditional Approval', color: 'bg-amber-50 text-amber-700 border-amber-200', Icon: AlertTriangle },
  rejected: { label: 'Rejected', color: 'bg-red-50 text-red-700 border-red-200', Icon: XCircle },
}

const DIMS = [
  ['financial_health', 'Financial Health', '30%'],
  ['repayment_history', 'Repayment', '25%'],
  ['collateral_coverage', 'Collateral', '20%'],
  ['management_quality', 'Management', '15%'],
  ['market_position', 'Market', '10%'],
]

export default function Recommendation() {
  const { assessment, company } = useStore()

  if (!assessment) {
    return (
      <div>
        <PageHeader title="Credit Recommendation" subtitle="Explainable AI credit decision" />
        <EmptyState title="No assessment yet" detail="Run a credit assessment to see the recommendation." />
      </div>
    )
  }

  const d = DECISION[assessment.decision] || DECISION.conditional
  const sb = assessment.score_breakdown || {}
  const radarData = DIMS.map(([key, label]) => ({ dim: label, score: sb[key] ?? 0 }))

  return (
    <div>
      <PageHeader title="Credit Recommendation" subtitle={`Final decision for ${company.name}`}>
        <Link to="/cam" className="btn-primary">Generate CAM <ArrowRight size={15} /></Link>
      </PageHeader>

      <div className={`card border ${d.color} flex items-center gap-4 mb-6 fade-in`}>
        <d.Icon size={34} />
        <div>
          <div className="text-xl font-semibold">{d.label}</div>
          <div className="text-sm opacity-80">Composite risk score {assessment.risk_score}/100 · {assessment.risk_band} risk</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6 fade-in">
        <Stat label="Recommended Loan" value={assessment.recommended_loan_cr != null ? `₹${assessment.recommended_loan_cr} Cr` : '—'} />
        <Stat label="Interest Rate" value={assessment.interest_rate_pct != null ? `${assessment.interest_rate_pct}%` : '—'} />
        <Stat label="Tenor" value={assessment.tenor_months != null ? `${assessment.tenor_months} months` : '—'} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-6 fade-in">
        <div className="card">
          <h3 className="font-semibold mb-2">Score Breakdown</h3>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData} outerRadius="75%">
              <PolarGrid stroke="rgba(0,0,0,0.08)" />
              <PolarAngleAxis dataKey="dim" tick={{ fontSize: 11 }} />
              <Radar dataKey="score" stroke="#0071e3" fill="#0071e3" fillOpacity={0.25} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3 className="font-semibold mb-4">Weighted Dimensions</h3>
          <div className="space-y-4">
            {DIMS.map(([key, label, weight]) => {
              const v = sb[key] ?? 0
              return (
                <div key={key}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium">{label} <span className="text-ink-faint text-xs">({weight})</span></span>
                    <span className="font-semibold">{v}</span>
                  </div>
                  <div className="h-2 rounded-full bg-black/[0.06] overflow-hidden">
                    <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${v}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="card mb-6 fade-in">
        <h3 className="font-semibold mb-3">AI Reasoning</h3>
        <div className="text-[15px] leading-relaxed text-ink-soft whitespace-pre-line">{assessment.reasoning}</div>
      </div>

      {(assessment.conditions || []).length > 0 && (
        <div className="card fade-in">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><ListChecks size={17} /> Loan Conditions & Covenants</h3>
          <ul className="space-y-2.5">
            {assessment.conditions.map((c, i) => (
              <li key={i} className="flex gap-3 text-sm text-ink-soft">
                <span className="w-5 h-5 rounded-full bg-accent-soft text-accent text-[11px] font-semibold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
