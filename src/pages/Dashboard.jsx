import React from 'react'
import { Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { useStore } from '../lib/store.jsx'
import { PageHeader, Stat, EmptyState } from '../components/ui.jsx'
import { ArrowRight } from 'lucide-react'

const BAND_COLORS = { Low: '#34c759', Medium: '#ff9f0a', High: '#ff3b30' }

export default function Dashboard() {
  const { history, company, assessment } = useStore()

  const counts = { High: 0, Medium: 0, Low: 0 }
  history.forEach((h) => { if (counts[h.risk_band] !== undefined) counts[h.risk_band]++ })
  const pieData = Object.entries(counts).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }))
  const recent = [...history.slice(0, 8)].reverse().map((h, i) => ({
    name: h.company?.slice(0, 12) || `#${i + 1}`, score: h.risk_score, band: h.risk_band,
  }))

  return (
    <div>
      <PageHeader title="Portfolio Dashboard" subtitle="Overview of your credit assessments">
        <Link to="/new" className="btn-primary">Start assessment <ArrowRight size={15} /></Link>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 fade-in">
        <Stat label="Total Assessments" value={history.length} />
        <Stat label="High Risk" value={counts.High} />
        <Stat label="Medium Risk" value={counts.Medium} />
        <Stat label="Low Risk" value={counts.Low} />
      </div>

      {history.length === 0 ? (
        <EmptyState
          title="No assessments yet"
          detail="Upload financial documents — PDF, Excel, CSV, Word, text, or even scanned images — and run your first AI credit assessment."
        />
      ) : (
        <div className="grid lg:grid-cols-5 gap-4 fade-in">
          <div className="card lg:col-span-3">
            <h3 className="font-semibold mb-4">Risk Score History</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={recent}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                  {recent.map((d, i) => <Cell key={i} fill={BAND_COLORS[d.band] || '#0071e3'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card lg:col-span-2">
            <h3 className="font-semibold mb-4">Risk Distribution</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {pieData.map((d, i) => <Cell key={i} fill={BAND_COLORS[d.name]} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="card lg:col-span-5">
            <h3 className="font-semibold mb-3">Recent Assessments</h3>
            <div className="divide-y divide-black/[0.05]">
              {history.slice(0, 10).map((h, i) => (
                <div key={i} className="flex items-center justify-between py-3 text-sm">
                  <div className="font-medium">{h.company || 'Unknown company'}</div>
                  <div className="flex items-center gap-4">
                    <span className="text-ink-faint text-xs">{new Date(h.date).toLocaleDateString()}</span>
                    <span className="capitalize text-ink-soft">{h.decision}</span>
                    <span className="font-semibold" style={{ color: BAND_COLORS[h.risk_band] }}>{h.risk_score}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {company.name && assessment && (
        <div className="mt-6 card flex items-center justify-between fade-in">
          <div>
            <div className="text-xs uppercase tracking-wide text-ink-faint font-semibold">Active session</div>
            <div className="font-semibold mt-0.5">{company.name}</div>
          </div>
          <Link to="/analysis" className="btn-secondary">Open analysis <ArrowRight size={14} /></Link>
        </div>
      )}
    </div>
  )
}
