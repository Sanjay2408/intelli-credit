import React from 'react'
import { Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useStore } from '../lib/store.jsx'
import { PageHeader, Stat, EmptyState, AlertCard, fmtCr } from '../components/ui.jsx'
import RiskGauge from '../components/RiskGauge.jsx'
import { ArrowRight } from 'lucide-react'

export default function AIAnalysis() {
  const { assessment, company } = useStore()

  if (!assessment) {
    return (
      <div>
        <PageHeader title="AI Analysis" subtitle="Risk gauge, financial KPIs and alerts" />
        <EmptyState title="No assessment yet" detail="Run a credit assessment to see the AI risk analysis." />
      </div>
    )
  }

  const fo = assessment.financial_overview || {}
  const pm = assessment.profitability_metrics || {}
  const trend = (assessment.yearly_trend || []).map((t) => ({
    year: t.year, Revenue: t.revenue_cr, Profit: t.profit_cr, Debt: t.debt_cr,
  }))
  const metrics = [
    ['Net Margin', pm.net_margin_pct != null ? `${pm.net_margin_pct}%` : '—'],
    ['ROE', pm.roe_pct != null ? `${pm.roe_pct}%` : '—'],
    ['DSCR', pm.dscr ?? '—'],
    ['Debt / Equity', pm.debt_equity ?? '—'],
    ['Interest Coverage', pm.interest_coverage ?? '—'],
  ]

  return (
    <div>
      <PageHeader title="AI Analysis" subtitle={`Financial intelligence for ${company.name}`}>
        <Link to="/recommendation" className="btn-primary">Credit decision <ArrowRight size={15} /></Link>
      </PageHeader>

      <div className="grid lg:grid-cols-3 gap-4 mb-6 fade-in">
        <div className="card flex flex-col items-center justify-center">
          <h3 className="font-semibold self-start mb-2">Risk Score</h3>
          <RiskGauge score={assessment.risk_score} band={assessment.risk_band} />
        </div>
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          <Stat label="Annual Revenue" value={fmtCr(fo.annual_revenue_cr)} />
          <Stat label="Net Profit" value={fmtCr(fo.net_profit_cr)} />
          <Stat label="Total Debt" value={fmtCr(fo.total_debt_cr)} />
          <Stat label="GST Turnover" value={fmtCr(fo.gst_turnover_cr)} />
        </div>
      </div>

      <div className="card mb-6 fade-in">
        <h3 className="font-semibold mb-4">Profitability & Coverage</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {metrics.map(([label, value]) => (
            <div key={label} className="rounded-xl bg-black/[0.03] p-4 text-center">
              <div className="text-lg font-semibold">{value}</div>
              <div className="text-[11px] uppercase tracking-wide text-ink-faint mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {trend.length > 0 && (
        <div className="card mb-6 fade-in">
          <h3 className="font-semibold mb-4">Yearly Financial Trend (₹ Cr)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={trend}>
              <XAxis dataKey="year" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
              <Tooltip cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
              <Legend />
              <Bar dataKey="Revenue" fill="#0071e3" radius={[5, 5, 0, 0]} />
              <Bar dataKey="Profit" fill="#34c759" radius={[5, 5, 0, 0]} />
              <Bar dataKey="Debt" fill="#ff9f0a" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {(assessment.risk_alerts || []).length > 0 && (
        <div className="fade-in">
          <h3 className="font-semibold mb-3">Risk Alerts</h3>
          <div className="grid md:grid-cols-2 gap-3">
            {assessment.risk_alerts.map((a, i) => (
              <AlertCard key={i} severity={a.severity} title={a.title} detail={a.detail} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
