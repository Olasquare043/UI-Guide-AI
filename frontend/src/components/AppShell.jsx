import { Dialog } from '@headlessui/react'
import { Menu, X, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import useApiStatus from '../hooks/useApiStatus'
import BrandMark from './BrandMark'

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Guided Walkthrough', to: '/app' },
  { label: 'Ask UI Guide', to: '/chat' },
  { label: 'History', to: '/history' },
  { label: 'About', to: '/about' },
]

const statusStyles = {
  online: 'bg-emerald-100 text-emerald-700',
  degraded: 'bg-amber-100 text-amber-700',
  offline: 'bg-rose-100 text-rose-700',
  checking: 'bg-slate-100 text-slate-600',
}

const AppShell = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false)
  const status = useApiStatus()

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-white/70 bg-white/70 shadow-sm backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-4 py-4 lg:px-8">
          <BrandMark />
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 lg:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `transition ${
                    isActive
                      ? 'text-slate-900 underline decoration-2 underline-offset-8'
                      : 'hover:text-slate-900'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="hidden items-center gap-3 lg:flex">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                statusStyles[status.state]
              }`}
            >
              {status.state === 'online' && status.latency
                ? `API ${status.latency}ms`
                : `API ${status.state}`}
            </span>
            <NavLink
              to="/app"
              className="flex items-center gap-2 rounded-full bg-[var(--ui-brand)] px-4 py-2 text-xs font-semibold text-white shadow hover:bg-[var(--ui-brand-strong)]"
            >
              <Sparkles className="h-4 w-4" />
              Try it now
            </NavLink>
          </div>
          <button
            className="rounded-full border border-slate-200 bg-white p-2 text-slate-700 shadow-sm hover:border-[var(--ui-brand)] hover:text-[var(--ui-brand)] lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
        <div className="border-t border-white/60 bg-gradient-to-r from-[#0b2d5c] via-[#123a73] to-[#0f4c81] text-white">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-2 px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.2em] lg:px-8">
            <img
              src="/ui-logo.webp"
              alt="University of Ibadan crest"
              className="h-6 w-auto object-contain"
            />
            <span>University of Ibadan</span>
            <span className="hidden text-white/80 sm:inline">Official guidance assistant</span>
          </div>
        </div>
      </header>

      <Dialog
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        className="relative z-50 lg:hidden"
      >
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-start justify-end p-4">
          <Dialog.Panel className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <BrandMark />
              <button
                className="rounded-full border border-slate-200 p-2 hover:border-[var(--ui-brand)] hover:text-[var(--ui-brand)]"
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-6 flex flex-col gap-3 text-sm font-medium text-slate-700">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `rounded-2xl px-4 py-3 transition ${
                      isActive
                        ? 'bg-[var(--ui-brand)] text-white'
                        : 'bg-slate-100 hover:bg-slate-200'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-xs text-slate-600">
              <span>API status</span>
              <span className={`rounded-full px-2 py-1 ${statusStyles[status.state]}`}>
                {status.state}
              </span>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      <main className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 lg:px-8">{children}</div>
      </main>

      <footer className="border-t border-white/10 bg-gradient-to-br from-[#0b2d5c] via-[#123a73] to-[#0f4c81] py-10 text-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-white/10 p-3 shadow-lg">
              <img
                src="/ui-logo.webp"
                alt="University of Ibadan crest"
                className="h-10 w-auto object-contain"
              />
            </div>
            <div>
              <p className="text-lg font-semibold">UI Guide</p>
              <p className="text-sm text-white/80">
                Trusted guidance for University of Ibadan policies and processes.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-white/70">
                <span className="rounded-full bg-white/10 px-3 py-1">Secure by design</span>
                <span className="rounded-full bg-white/10 px-3 py-1">Built for mobile</span>
                <span className="rounded-full bg-white/10 px-3 py-1">Version 2.1</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-start gap-3 text-xs text-white/80 lg:items-end">
            <span className="uppercase tracking-[0.2em] text-white/60">Start here</span>
            <NavLink
              to="/app"
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-900 shadow hover:bg-slate-100"
            >
              <Sparkles className="h-4 w-4" />
              Launch a walkthrough
            </NavLink>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default AppShell
