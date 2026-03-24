import { useEffect, useState } from 'react'
import { getCapabilities } from '../services/api'

const initialCapabilities = {
  isLoading: true,
  serverSpeechSynthesis: false,
  serverSpeechTranscription: false,
  vectorStoreReady: false,
}

const useCapabilities = () => {
  const [capabilities, setCapabilities] = useState(initialCapabilities)

  useEffect(() => {
    let active = true
    const controller = new AbortController()

    const load = async () => {
      try {
        const next = await getCapabilities({ signal: controller.signal })
        if (!active) return
        setCapabilities({ ...next, isLoading: false })
      } catch {
        if (!active) return
        setCapabilities((current) => ({ ...current, isLoading: false }))
      }
    }

    load()

    return () => {
      active = false
      controller.abort()
    }
  }, [])

  return capabilities
}

export default useCapabilities
