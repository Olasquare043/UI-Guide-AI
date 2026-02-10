import { NavLink } from 'react-router-dom'

const NotFound = () => (
  <div className="flex min-h-[60vh] flex-col items-start justify-center gap-4 rounded-[28px] border border-white/70 bg-white/80 p-10 shadow-sm">
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">404</p>
    <h1 className="text-2xl font-semibold text-slate-900">This page could not be found.</h1>
    <p className="text-sm text-slate-600">
      Return to the UI Guide homepage or start a walkthrough.
    </p>
    <div className="flex gap-3">
      <NavLink
        to="/"
        className="rounded-full bg-[var(--ui-brand)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--ui-brand-strong)]"
      >
        Back home
      </NavLink>
      <NavLink
        to="/app"
        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-[var(--ui-brand)] hover:text-[var(--ui-brand)]"
      >
        Start walkthrough
      </NavLink>
    </div>
  </div>
)

export default NotFound
