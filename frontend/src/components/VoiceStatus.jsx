import React from 'react'

const toneStyles = {
  listening: {
    container: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    bar: 'bg-emerald-500',
  },
  recording: {
    container: 'border-amber-200 bg-amber-50 text-amber-900',
    bar: 'bg-amber-500',
  },
  transcribing: {
    container: 'border-sky-200 bg-sky-50 text-sky-900',
    bar: 'bg-sky-500',
  },
}

const VoiceStatus = ({ mode = 'listening', title, description }) => {
  const styles = toneStyles[mode] || toneStyles.listening
  const barHeights = [12, 18, 24, 16]
  const descriptionId = React.useId()

  return (
    <div
      role="status"
      aria-live="polite"
      aria-describedby={description ? descriptionId : undefined}
      className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm shadow-sm ${styles.container}`}
    >
      <div className="flex h-6 items-end gap-1" aria-hidden="true">
        {barHeights.map((height, index) => (
          <span
            key={`${mode}-${height}-${index}`}
            className={`w-1 rounded-full ${styles.bar} animate-pulse`}
            style={{
              height: `${height}px`,
              animationDelay: `${index * 140}ms`,
              animationDuration: '900ms',
            }}
          />
        ))}
      </div>
      <div className="min-w-0">
        <p className="font-semibold">{title}</p>
        {description && (
          <p id={descriptionId} className="text-xs leading-5 text-current/80">
            {description}
          </p>
        )}
      </div>
    </div>
  )
}

export default VoiceStatus
