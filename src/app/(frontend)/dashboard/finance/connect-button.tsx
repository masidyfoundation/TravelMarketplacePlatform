'use client'

import { ExternalLink, LoaderCircle } from 'lucide-react'
import { useState } from 'react'

export default function ConnectButton({ agencyId }: { agencyId?: string }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const connect = async () => {
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/payments/connect', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ agencyId }),
      })
      const result = (await response.json()) as { url?: string; error?: string }
      if (!response.ok || !result.url) {
        setError(result.error || 'Onboarding could not be started.')
        return
      }
      window.location.assign(result.url)
    } finally {
      setBusy(false)
    }
  }
  return (
    <div>
      <button
        onClick={connect}
        disabled={busy}
        className="flex items-center gap-2 rounded-xl bg-[#635bff] px-5 py-3 text-xs font-extrabold text-white disabled:opacity-60"
      >
        {busy ? <LoaderCircle className="animate-spin" size={15} /> : <ExternalLink size={15} />}
        Continue with Stripe
      </button>
      {error && <p className="mt-2 text-xs font-bold text-rose-600">{error}</p>}
    </div>
  )
}
