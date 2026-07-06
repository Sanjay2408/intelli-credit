import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar.jsx'
import TopNav from './components/TopNav.jsx'
import Dashboard from './pages/Dashboard.jsx'
import NewAssessment from './pages/NewAssessment.jsx'
import AIAnalysis from './pages/AIAnalysis.jsx'
import Recommendation from './pages/Recommendation.jsx'
import CAMReport from './pages/CAMReport.jsx'
import Research from './pages/Research.jsx'
import SwotPage from './pages/SwotPage.jsx'
import GSTValidation from './pages/GSTValidation.jsx'
import DocQuery from './pages/DocQuery.jsx'

export default function App() {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav />
        <main className="flex-1 px-6 md:px-10 py-8 max-w-6xl w-full mx-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/new" element={<NewAssessment />} />
            <Route path="/analysis" element={<AIAnalysis />} />
            <Route path="/recommendation" element={<Recommendation />} />
            <Route path="/cam" element={<CAMReport />} />
            <Route path="/research" element={<Research />} />
            <Route path="/swot" element={<SwotPage />} />
            <Route path="/gst" element={<GSTValidation />} />
            <Route path="/query" element={<DocQuery />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
