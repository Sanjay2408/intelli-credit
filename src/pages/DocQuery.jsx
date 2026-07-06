import React, { useRef, useState } from 'react'
import { useStore } from '../lib/store.jsx'
import { queryDocuments } from '../lib/api.js'
import { PageHeader, EmptyState, ErrorBanner } from '../components/ui.jsx'
import { SendHorizonal, Loader2, User, Sparkles } from 'lucide-react'

const SUGGESTIONS = [
  'What is the total revenue and how has it trended?',
  'Are there any litigation or regulatory risks mentioned?',
  'Summarize the debt and borrowing profile.',
  'What is the DSCR and interest coverage?',
]

export default function DocQuery() {
  const { chunks } = useStore()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef()

  if (chunks.length === 0) {
    return (
      <div>
        <PageHeader title="Document Q&A" subtitle="Ask anything about your uploaded documents" />
        <EmptyState detail="Upload documents first, then ask natural-language questions grounded in them." />
      </div>
    )
  }

  const ask = async (q) => {
    const question = (q || input).trim()
    if (!question || loading) return
    setInput('')
    setError('')
    setMessages((m) => [...m, { role: 'user', text: question }])
    setLoading(true)
    try {
      const res = await queryDocuments(question, chunks)
      setMessages((m) => [...m, { role: 'ai', text: res.answer, sources: res.sources }])
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <PageHeader title="Document Q&A" subtitle="RAG-grounded answers with evidence from your documents" />
      <ErrorBanner message={error} />

      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.length === 0 && (
          <div className="grid sm:grid-cols-2 gap-3 fade-in">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => ask(s)}
                className="card !p-4 text-left text-sm text-ink-soft hover:shadow-lift transition-shadow">
                {s}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 fade-in ${m.role === 'user' ? 'justify-end' : ''}`}>
            {m.role === 'ai' && (
              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0 mt-1">
                <Sparkles size={14} className="text-white" />
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-5 py-3.5 text-[15px] leading-relaxed ${
              m.role === 'user' ? 'bg-accent text-white' : 'bg-white shadow-card'
            }`}>
              <div className="whitespace-pre-line">{m.text}</div>
              {m.sources?.length > 0 && (
                <details className="mt-3 text-xs text-ink-faint">
                  <summary className="cursor-pointer font-medium">Evidence ({m.sources.length} sources)</summary>
                  <div className="mt-2 space-y-2">
                    {m.sources.map((s, j) => (
                      <div key={j} className="rounded-lg bg-black/[0.03] p-2.5">
                        <div className="font-semibold">{s.source} · {s.section}</div>
                        <div className="mt-1 line-clamp-3">{s.text}</div>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
            {m.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-black/[0.07] flex items-center justify-center shrink-0 mt-1">
                <User size={14} className="text-ink-soft" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-ink-faint text-sm pl-11">
            <Loader2 size={14} className="animate-spin" /> Thinking…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="card !p-2.5 flex gap-2 sticky bottom-4">
        <input className="input !border-0 !ring-0 !shadow-none bg-transparent" placeholder="Ask about revenue, debt, risks, compliance…"
          value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && ask()} />
        <button onClick={() => ask()} disabled={loading || !input.trim()} className="btn-primary !px-5">
          <SendHorizonal size={16} />
        </button>
      </div>
    </div>
  )
}
