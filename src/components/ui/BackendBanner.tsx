/**
 * Shows a sticky warning when the FastAPI backend is not reachable.
 */
import { AlertCircle, Loader2 } from 'lucide-react'

interface Props {
  status: 'idle' | 'loading' | 'success' | 'error'
  error?: string | null
}

export default function BackendBanner({ status, error }: Props) {
  if (status === 'success') return null
  if (status === 'loading' || status === 'idle') {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-50 border border-indigo-100 text-sm text-indigo-700">
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        Menghubungkan ke backend…
      </div>
    )
  }
  return (
    <div className="flex items-start gap-2 px-4 py-3 rounded-lg bg-rose-50 border border-rose-100 text-sm text-rose-700">
      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
      <div>
        <span className="font-semibold">Backend tidak terjangkau.</span>{' '}
        Pastikan FastAPI berjalan di <code className="text-xs bg-rose-100 px-1 py-0.5 rounded">localhost:8000</code>.
        {error && <p className="mt-1 text-xs opacity-75">{error}</p>}
        <p className="mt-1 text-xs">Jalankan: <code className="bg-rose-100 px-1 py-0.5 rounded">cd nusa-insight/backend &amp;&amp; uvicorn main:app --reload</code></p>
      </div>
    </div>
  )
}
