import { lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'

// Code-split each page so heavy deps (e.g. recharts on Progress) load on demand.
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Translator = lazy(() => import('./pages/Translator'))
const Writing = lazy(() => import('./pages/Writing'))
const Vocabulary = lazy(() => import('./pages/Vocabulary'))
const Progress = lazy(() => import('./pages/Progress'))

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="translator" element={<Translator />} />
        <Route path="writing" element={<Writing />} />
        <Route path="vocabulary" element={<Vocabulary />} />
        <Route path="progress" element={<Progress />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
