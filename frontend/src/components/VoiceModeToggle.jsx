import React from 'react'

const VoiceModeToggle = ({
  enabled,
  onChange,
  disabled = false,
  label = 'Voice mode',
  description = 'Automatically read new guidance and chat replies aloud.',
}) => {
  const descriptionId = React.useId()

  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-slate-800">{label}</p>
          <p id={descriptionId} className="mt-1 text-xs leading-5 text-slate-500">
            {description}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label={label}
          aria-describedby={descriptionId}
          disabled={disabled}
          onClick={() => onChange(!enabled)}
          className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition ${
            enabled
              ? 'border-[var(--ui-brand)] bg-[var(--ui-brand)]'
              : 'border-slate-200 bg-white'
          } disabled:cursor-not-allowed disabled:border-slate-100 disabled:bg-slate-100`}
        >
          <span
            className={`inline-block h-5 w-5 rounded-full bg-white shadow transition ${
              enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  )
}

export default VoiceModeToggle
