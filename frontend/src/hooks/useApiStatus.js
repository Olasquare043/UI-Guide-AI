import { useEffect, useState } from 'react'
import { checkHealth, getCapabilities } from '../services/api'

const defaultCapabilities = {
  serverSpeechSynthesis: false,
  serverSpeechTranscription: false,
  vectorStoreReady: false,
}

const useApiStatus = () => {
  const [status, setStatus] = useState({
    state: 'checking',
    message: 'Checking API...',
    capabilities: defaultCapabilities,
  })

  useEffect(() => {
    let active = true

    const ping = async () => {
      const start = Date.now()

      try {
        const [health, capabilities] = await Promise.all([
          checkHealth(),
          getCapabilities().catch(() => defaultCapabilities),
        ])
        if (!active) return
        const latency = Date.now() - start
        setStatus({
          state: health.status === 'healthy' ? 'online' : 'degraded',
          message: health.message || 'Connected',
          latency,
          capabilities,
        })
      } catch {
        if (!active) return
        setStatus({
          state: 'offline',
          message: 'Offline',
          latency: null,
          capabilities: defaultCapabilities,
        })
      }
    }

    ping()
    const interval = window.setInterval(ping, 60000)

    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [])

  return status
}

export default useApiStatus
