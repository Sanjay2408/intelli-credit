import React from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useStore } from '../lib/store.jsx'
import { FileStack, RotateCcw, Sparkles } from 'lucide-react'

export default function TopNav() {
  const { company, documents, resetSession } = useStore()
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <header className="sticky top-0 z-20 h-16 flex items-center justify-between px-6 md:px-10 bg-surface/80 backdrop-blur-xl border-b border-black/[0.05]">
      <div className="flex items-center gap-3 min-w-0 md:hidden">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
            <Sparkles size={14} className="text-white" />
          </div>
          <span className="font-semibold tracking-tight">IntelliCredit</span>
        </Link>
      </div>
      <div className="hidden md:flex items-center gap-2 text-sm text-ink-soft min-w-0">
        {company.name ? (
          <>
            <span className="font-semibold text-ink truncate">{company.name}</span>
            {company.sector && <span className="text-ink-faint">· {company.sector}</span>}
            <span className="inline-flex items-center gap-1 ml-2 text-xs bg-black/[0.05] rounded-full px-2.5 py-1">
              <FileStack size={12} /> {documents.length} doc{documents.length === 1 ? '' : 's'}
            </span>
          </>
        ) : (
          <span className="text-ink-faint">No active assessment</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {(company.name || documents.length > 0) && (
          <button
            onClick={() => { if (confirm('Clear the current session (documents, assessment, company)?')) { resetSession(); navigate('/new') } }}
            className="btn-secondary !px-4 !py-2 text-xs"
          >
            <RotateCcw size={13} /> Reset
          </button>
        )}
        {location.pathname !== '/new' && (
          <button onClick={() => navigate('/new')} className="btn-primary !px-4 !py-2 text-xs">
            New Assessment
          </button>
        )}
      </div>
    </header>
  )
}
