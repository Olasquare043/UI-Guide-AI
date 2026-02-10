import { useEffect, useState } from 'react'
import { checkHealth } from '../services/api'

const useApiStatus = () => {
  const [status, setStatus] = useState({ state: 'checking', message: 'Checking API...' })

  useEffect(() => {
    let active = true

    const ping = async () => {
      const start = Date.now()
      try {
        const health = await checkHealth()
        if (!active) return
        const latency = Date.now() - start
        setStatus({
          state: health.status === 'healthy' ? 'online' : 'degraded',
          message: health.message || 'Connected',
          latency,
        })
      } catch {
        if (!active) return
        setStatus({ state: 'offline', message: 'Offline', latency: null })
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
