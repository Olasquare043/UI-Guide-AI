import { ArrowRight, BookOpen, Compass, ShieldCheck, Sparkles } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const features = [
  {
    title: 'Trusted Guidance',
    description: 'Grounded in official University of Ibadan policy documents.',
    icon: ShieldCheck,
  },
  {
    title: 'Step-by-Step Flow',
    description: 'Turn complex processes into clear, actionable walkthroughs.',
    icon: Compass,
  },
  {
    title: 'Smart Summaries',
    description: 'Quick answers with context, notes, and next steps.',
    icon: BookOpen,
  },
]

const Home = () => {
  return (
    <div className="space-y-16">
      <section className="relative overflow-hidden rounded-[32px] border border-white/70 bg-gradient-to-br from-white via-[#fffaf2] to-[#eef4ff] p-8 shadow-lg lg:p-12">
        <div className="absolute right-[-10%] top-[-15%] h-48 w-48 rounded-full bg-[#f4dfb1] opacity-60 blur-3xl" />
        <div className="absolute bottom-[-20%] left-[10%] h-64 w-64 rounded-full bg-[#d7e3f6] opacity-50 blur-3xl" />
        <div className="relative z-10 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-[var(--ui-brand)] px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
              <Sparkles className="h-4 w-4" />
              UI Guide
            </span>
            <h1 className="text-3xl font-semibold text-slate-900 lg:text-5xl">
              Clear, confident guidance for every University of Ibadan process.
            </h1>
            <p className="text-base text-slate-600 lg:text-lg">
              UI Guide brings together official policy documents and an intelligent walkthrough
              engine to help students, staff, and prospective applicants move from questions to
              clarity.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <NavLink
                to="/app"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--ui-brand)] px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-[var(--ui-brand-strong)]"
              >
                Start a walkthrough
                <ArrowRight className="h-4 w-4" />
              </NavLink>
              <NavLink
                to="/chat"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow hover:border-[var(--ui-brand)] hover:text-[var(--ui-brand)]"
              >
                Ask a question
              </NavLink>
            </div>
          </div>
          <div className="grid gap-4">
            <div className="rounded-3xl border border-slate-100 bg-white/90 p-5 shadow-sm">
              <div className="flex items-center justify-between text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-slate-500">
                <span>Official Identity</span>
                <span className="rounded-full bg-[var(--ui-brand)] px-2 py-1 text-[0.6rem] text-white">
                  University of Ibadan
                </span>
              </div>
              <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                <img
                  src="/ui-logo.jpeg"
                  alt="University of Ibadan logo"
                  className="h-32 w-full object-cover sm:h-36"
                  loading="eager"
                />
              </div>
              <p className="mt-3 text-xs text-slate-600">
                UI Guide is built exclusively for University of Ibadan policies and student support.
              </p>
            </div>
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-3xl border border-slate-100 bg-white/80 p-5 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f5e2b8] text-slate-800">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">{feature.title}</h3>
                    <p className="text-sm text-slate-600">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-slate-900">How it works</h2>
          <p className="text-sm text-slate-600">
            UI Guide stays focused on official documents, then organizes the response into a guided
            walkthrough.
          </p>
          <div className="grid gap-4">
            {[
              {
                title: 'Describe the request',
                description: 'Select a context and share your task or UI description.',
              },
              {
                title: 'Analyze with policy context',
                description: 'We search the knowledge base and craft a structured response.',
              },
              {
                title: 'Receive a clear plan',
                description: 'Get steps, rationale, and next actions you can trust.',
              },
            ].map((item, index) => (
              <div
                key={item.title}
                className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--ui-brand)] text-xs font-semibold text-white">
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
                  <p className="text-xs text-slate-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[28px] border border-white/70 bg-gradient-to-br from-[#0b2d5c] via-[#123a73] to-[#0f4c81] p-8 text-white shadow-lg">
          <h3 className="text-2xl font-semibold">Designed for real-world UI journeys</h3>
          <p className="mt-3 text-sm text-slate-200">
            Whether you need to understand admissions, course registration, or faculty processes,
            the guided walkthrough keeps users on-track with verified steps and clear rationale.
          </p>
          <div className="mt-6 rounded-2xl bg-white/10 p-4 text-xs text-slate-100">
            “UI Guide helped me validate the admissions checklist in minutes instead of hours.”
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
