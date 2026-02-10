export const loadJson = (key, fallback) => {
  if (typeof window === 'undefined') return fallback
  try {
    const stored = window.localStorage.getItem(key)
    if (!stored) return fallback
    return JSON.parse(stored)
  } catch {
    return fallback
  }
}

export const saveJson = (key, value) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore write errors
  }
}

export const removeJson = (key) => {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(key)
}
