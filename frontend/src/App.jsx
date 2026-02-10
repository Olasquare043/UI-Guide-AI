import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import AppShell from './components/AppShell'

const Home = lazy(() => import('./pages/Home'))
const Guide = lazy(() => import('./pages/Guide'))
const Chat = lazy(() => import('./pages/Chat'))
const History = lazy(() => import('./pages/History'))
const About = lazy(() => import('./pages/About'))
const NotFound = lazy(() => import('./pages/NotFound'))

const PageLoader = () => (
  <div className="flex min-h-[40vh] items-center justify-center">
    <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm">
      <span className="h-2 w-2 animate-pulse rounded-full bg-slate-500" />
      Loading experience...
    </div>
  </div>
)

const App = () => (
  <AppShell>
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/app" element={<Guide />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/history" element={<History />} />
        <Route path="/about" element={<About />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  </AppShell>
)

export default App
