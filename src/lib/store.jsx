import React, { createContext, useContext, useEffect, useState } from 'react'

// Global app state: uploaded document chunks, company info, assessment result,
// history — persisted to localStorage so a refresh doesn't lose the session.
const StoreContext = createContext(null)

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function StoreProvider({ children }) {
  const [chunks, setChunks] = useState(() => load('ic_chunks', []))
  const [documents, setDocuments] = useState(() => load('ic_documents', []))
  const [company, setCompany] = useState(() => load('ic_company', { name: '', sector: '', loanCr: '' }))
  const [assessment, setAssessment] = useState(() => load('ic_assessment', null))
  const [history, setHistory] = useState(() => load('ic_history', []))
  const [ids, setIds] = useState(() => load('ic_ids', { pans: [], gstins: [] }))
  const [verification, setVerification] = useState(() => load('ic_verification', null))

  useEffect(() => { try { localStorage.setItem('ic_chunks', JSON.stringify(chunks)) } catch { /* quota */ } }, [chunks])
  useEffect(() => { localStorage.setItem('ic_documents', JSON.stringify(documents)) }, [documents])
  useEffect(() => { localStorage.setItem('ic_company', JSON.stringify(company)) }, [company])
  useEffect(() => { localStorage.setItem('ic_assessment', JSON.stringify(assessment)) }, [assessment])
  useEffect(() => { localStorage.setItem('ic_history', JSON.stringify(history)) }, [history])
  useEffect(() => { localStorage.setItem('ic_ids', JSON.stringify(ids)) }, [ids])
  useEffect(() => { localStorage.setItem('ic_verification', JSON.stringify(verification)) }, [verification])

  const addAssessmentToHistory = (a, companyName) => {
    setHistory((h) => [
      { company: companyName, risk_score: a.risk_score, risk_band: a.risk_band, decision: a.decision, date: new Date().toISOString() },
      ...h,
    ].slice(0, 50))
  }

  const resetSession = () => {
    setChunks([])
    setDocuments([])
    setAssessment(null)
    setCompany({ name: '', sector: '', loanCr: '' })
    setIds({ pans: [], gstins: [] })
    setVerification(null)
  }

  return (
    <StoreContext.Provider value={{
      chunks, setChunks, documents, setDocuments, company, setCompany,
      assessment, setAssessment, history, addAssessmentToHistory, resetSession,
      ids, setIds, verification, setVerification,
    }}>
      {children}
    </StoreContext.Provider>
  )
}

export const useStore = () => useContext(StoreContext)
