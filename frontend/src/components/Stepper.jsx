const Stepper = ({ steps, currentStep }) => {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {steps.map((step, index) => {
        const isActive = index === currentStep
        const isComplete = index < currentStep
        return (
          <div key={step} className="flex items-center gap-3">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                isComplete
                  ? 'bg-emerald-500 text-white'
                  : isActive
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-200 text-slate-600'
              }`}
            >
              {index + 1}
            </div>
            <span
              className={`text-xs font-semibold uppercase tracking-wide ${
                isActive ? 'text-slate-900' : 'text-slate-500'
              }`}
            >
              {step}
            </span>
            {index !== steps.length - 1 && (
              <div className="h-px w-6 bg-slate-200" aria-hidden="true" />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default Stepper
