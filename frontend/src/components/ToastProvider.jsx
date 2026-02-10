import { useCallback, useMemo, useState } from 'react'
import ToastContext from '../context/toast'

const variantStyles = {
  info: 'border-blue-200 bg-blue-50 text-blue-900',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  error: 'border-rose-200 bg-rose-50 text-rose-900',
}

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const pushToast = useCallback(
    ({ title, description, variant = 'info', duration = 4000 }) => {
      const id = crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
      setToasts((prev) => [...prev, { id, title, description, variant }])
      if (duration > 0) {
        window.setTimeout(() => removeToast(id), duration)
      }
    },
    [removeToast]
  )

  const value = useMemo(() => ({ pushToast }), [pushToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed right-4 top-5 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3"
        role="region"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-2xl border px-4 py-3 shadow-lg backdrop-blur ${
              variantStyles[toast.variant]
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{toast.title}</p>
                {toast.description ? (
                  <p className="mt-1 text-sm text-slate-700">{toast.description}</p>
                ) : null}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                aria-label="Dismiss notification"
              >
                Close
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
