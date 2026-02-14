const faqs = [
  {
    question: 'What sources does UI Guide use?',
    answer:
      'Answers are grounded in official University of Ibadan policy documents stored in the knowledge base.',
  },
  {
    question: 'Can I trust the guidance?',
    answer:
      'UI Guide cites sources when available and highlights when information is missing so you can verify.',
  },
  {
    question: 'How should I use the guided walkthrough?',
    answer:
      'Provide a clear task and context. The walkthrough will return steps, rationale, notes, and next actions.',
  },
]

const About = () => {
  return (
    <div className="space-y-10">
      <section className="rounded-[28px] border border-white/70 bg-gradient-to-br from-white via-[#f7faff] to-[#edf2ff] p-6 shadow-sm lg:p-8">
        <h1 className="text-2xl font-semibold text-slate-900">About UI Guide</h1>
        <p className="mt-2 text-sm text-slate-600">
          UI Guide is a University of Ibadan assistant designed to turn policy-heavy processes into
          understandable actions. It combines structured retrieval with UX-focused explanation so
          users can move confidently through administrative tasks.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-sm ring-1 ring-slate-200/70">
          <h2 className="text-lg font-semibold text-slate-900">Mission</h2>
          <p className="mt-3 text-sm text-slate-600">
            Make University of Ibadan processes easier to understand through accessible,
            step-by-step guidance and reliable sources.
          </p>
        </div>
        <div className="rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-sm ring-1 ring-slate-200/70">
          <h2 className="text-lg font-semibold text-slate-900">Product principles</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>Clarity over complexity</li>
            <li>Source transparency</li>
            <li>Mobile-first usability</li>
          </ul>
        </div>
      </section>

      <section className="rounded-[28px] border border-white/70 bg-gradient-to-br from-white via-[#fdf7ef] to-[#eef4ff] p-6 shadow-sm lg:p-8">
        <h2 className="text-lg font-semibold text-slate-900">FAQ</h2>
        <div className="mt-4 space-y-3">
          {faqs.map((faq) => (
            <div
              key={faq.question}
              className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm ring-1 ring-slate-200/60"
            >
              <p className="text-sm font-semibold text-slate-900">{faq.question}</p>
              <p className="mt-2 text-xs text-slate-600">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default About
