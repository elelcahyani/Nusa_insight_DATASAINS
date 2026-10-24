/**
 * Minimal hook for async API calls with loading/error state.
 */
import { useState, useEffect, useCallback } from 'react'
import type { ApiStatus } from '@/types'

interface UseApiState<T> {
  data: T | null
  status: ApiStatus
  error: string | null
  refetch: () => void
}

export function useApi<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = []
): UseApiState<T> {
  const [data, setData] = useState<T | null>(null)
  const [status, setStatus] = useState<ApiStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const fetch_ = useCallback(() => {
    setStatus('loading')
    setError(null)
    fetcher()
      .then(d => { setData(d); setStatus('success') })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : 'Terjadi kesalahan'
        setError(msg)
        setStatus('error')
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => { fetch_() }, [fetch_])

  return { data, status, error, refetch: fetch_ }
}
