import React from 'react'

// Apple-style SVG semicircular risk gauge, 0 (safe) → 100 (risky)
export default function RiskGauge({ score = 0, band = 'Low' }) {
  const clamped = Math.max(0, Math.min(100, score))
  const angle = (clamped / 100) * 180
  const r = 84
  const cx = 110
  const cy = 110
  const rad = (deg) => ((deg - 180) * Math.PI) / 180
  const arc = (start, end, color) => {
    const x1 = cx + r * Math.cos(rad(start))
    const y1 = cy + r * Math.sin(rad(start))
    const x2 = cx + r * Math.cos(rad(end))
    const y2 = cy + r * Math.sin(rad(end))
    return <path d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`} stroke={color} strokeWidth="14" fill="none" strokeLinecap="round" />
  }
  const needleX = cx + (r - 22) * Math.cos(rad(angle))
  const needleY = cy + (r - 22) * Math.sin(rad(angle))
  const color = band === 'High' ? '#dc2626' : band === 'Medium' ? '#d97706' : '#059669'

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 220 130" className="w-full max-w-[260px]">
        {arc(2, 62, '#34d399')}
        {arc(66, 116, '#fbbf24')}
        {arc(120, 178, '#f87171')}
        <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke="#1d1d1f" strokeWidth="3" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="6" fill="#1d1d1f" />
      </svg>
      <div className="-mt-3 text-center">
        <div className="text-4xl font-semibold tracking-tight" style={{ color }}>{clamped}</div>
        <div className="text-xs font-semibold uppercase tracking-wider text-ink-faint mt-0.5">{band} risk</div>
      </div>
    </div>
  )
}
