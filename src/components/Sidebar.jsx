import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutGrid, FilePlus2, Activity, BadgeCheck, FileText,
  Globe, Grid2x2, ReceiptText, MessageSquareText, Sparkles,
} from 'lucide-react'

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutGrid },
  { to: '/new', label: 'New Assessment', icon: FilePlus2 },
  { to: '/analysis', label: 'AI Analysis', icon: Activity },
  { to: '/recommendation', label: 'Recommendation', icon: BadgeCheck },
  { to: '/cam', label: 'CAM Report', icon: FileText },
  { to: '/research', label: 'Research', icon: Globe },
  { to: '/swot', label: 'SWOT', icon: Grid2x2 },
  { to: '/gst', label: 'GST Validation', icon: ReceiptText },
  { to: '/query', label: 'Doc Q&A', icon: MessageSquareText },
]

export default function Sidebar() {
  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-black/[0.06] bg-white/70 backdrop-blur-xl sticky top-0 h-screen">
      <div className="flex items-center gap-2.5 px-6 h-16">
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
          <Sparkles size={16} className="text-white" />
        </div>
        <span className="font-semibold tracking-tight text-[17px]">IntelliCredit</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all ${
                isActive
                  ? 'bg-accent-soft text-accent font-semibold'
                  : 'text-ink-soft hover:bg-black/[0.04] hover:text-ink'
              }`
            }
          >
            <Icon size={17} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-6 py-5 text-[11px] text-ink-faint leading-relaxed">
        AI Corporate Credit
        <br />
        Appraisal Engine
      </div>
    </aside>
  )
}
