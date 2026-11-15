'use client'

import { Heart, LoaderCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function SaveTripButton({
  tripId,
  label = true,
}: {
  tripId: string
  label?: boolean
}) {
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true
    fetch('/api/saved-trips')
      .then(async (response) => {
        if (!response.ok) return { tripIDs: [] as string[] }
        return (await response.json()) as { tripIDs: string[] }
      })
      .then((result) => active && setSaved(result.tripIDs.includes(tripId)))
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [tripId])

  const toggle = async () => {
    setBusy(true)
    try {
      const response = await fetch('/api/saved-trips', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ tripId }),
      })
      if (response.status === 401) {
        window.location.assign('/login')
        return
      }
      const result = (await response.json()) as { saved?: boolean }
      if (response.ok && typeof result.saved === 'boolean') setSaved(result.saved)
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={saved}
      aria-label={saved ? 'Remove from saved journeys' : 'Save this journey'}
      className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-xs font-extrabold transition disabled:opacity-60 ${
        saved
          ? 'border-rose-100 bg-rose-50 text-rose-600'
          : 'border-slate-200 bg-white text-slate-600 hover:border-rose-200 hover:text-rose-600'
      } ${label ? 'w-full' : 'size-10 !p-0'}`}
    >
      {busy ? (
        <LoaderCircle className="animate-spin" size={17} />
      ) : (
        <Heart size={17} className={saved ? 'fill-current' : ''} />
      )}
      {label && (saved ? 'Saved to wishlist' : 'Save for later')}
    </button>
  )
}
