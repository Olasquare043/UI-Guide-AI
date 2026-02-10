import { Routes, Route } from 'react-router-dom'
import AppShell from './components/AppShell'
import Home from './pages/Home'
import Guide from './pages/Guide'
import Chat from './pages/Chat'
import History from './pages/History'
import About from './pages/About'
import NotFound from './pages/NotFound'

const App = () => (
  <AppShell>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/app" element={<Guide />} />
      <Route path="/chat" element={<Chat />} />
      <Route path="/history" element={<History />} />
      <Route path="/about" element={<About />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </AppShell>
)

export default App
