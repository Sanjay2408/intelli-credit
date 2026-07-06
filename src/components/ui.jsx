import React from 'react'
import { Link } from 'react-router-dom'
import { Loader2, FileSearch, AlertTriangle, AlertCircle, Info } from 'lucide-react'

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-8 fade-in">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="text-ink-soft mt-1.5 text-[15px]">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

export function Spinner({ label = 'Working…' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-ink-soft">
      <Loader2 className="animate-spin" size={20} />
      <span className="text-sm">{label}</span>
    </div>
  )
}

export function EmptyState({ title = 'No documents yet', detail, cta = 'Start a new assessment', to = '/new' }) {
  return (
    <div className="card flex flex-col items-center text-center py-16 fade-in">
      <div className="w-14 h-14 rounded-2xl bg-accent-soft flex items-center justify-center mb-4">
        <FileSearch className="text-accent" size={24} />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {detail && <p className="text-ink-soft text-sm mt-1.5 max-w-sm">{detail}</p>}
      <Link to={to} className="btn-primary mt-6">{cta}</Link>
    </div>
  )
}

export function ErrorBanner({ message }) {
  if (!message) return null
  return (
    <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm mb-6 fade-in">
      <AlertCircle size={17} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  )
}

export const bandColor = (band) =>
  band === 'High' ? 'text-red-600 bg-red-50 border-red-200'
    : band === 'Medium' ? 'text-amber-600 bg-amber-50 border-amber-200'
    : 'text-emerald-600 bg-emerald-50 border-emerald-200'

export function SeverityBadge({ severity }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide rounded-full border px-2.5 py-0.5 ${bandColor(severity)}`}>
      {severity === 'High' ? <AlertTriangle size={11} /> : severity === 'Medium' ? <AlertCircle size={11} /> : <Info size={11} />}
      {severity}
    </span>
  )
}

export function AlertCard({ severity, title, detail }) {
  return (
    <div className="card !p-4 flex items-start gap-3">
      <div className="pt-0.5"><SeverityBadge severity={severity} /></div>
      <div className="min-w-0">
        <div className="font-semibold text-sm">{title}</div>
        <div className="text-sm text-ink-soft mt-0.5">{detail}</div>
      </div>
    </div>
  )
}

export function Stat({ label, value, hint }) {
  return (
    <div className="card !p-5">
      <div className="text-xs font-semibold uppercase tracking-wide text-ink-faint">{label}</div>
      <div className="text-2xl font-semibold tracking-tight mt-1.5">{value}</div>
      {hint && <div className="text-xs text-ink-faint mt-1">{hint}</div>}
    </div>
  )
}

export const fmtCr = (v) =>
  v === null || v === undefined || v === '' || Number.isNaN(Number(v)) ? '—' : `₹${Number(v).toLocaleString('en-IN')} Cr`
