'use client'

import Script from 'next/script'
import { useRef, useState } from 'react'

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: {
          sitekey: string
          callback: (token: string) => void
          'expired-callback': () => void
          'error-callback': () => void
        },
      ) => string
    }
  }
}

export default function Turnstile() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  const target = useRef<HTMLDivElement>(null)
  const [token, setToken] = useState('')
  if (!siteKey) return <input type="hidden" name="captchaToken" value="" />
  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => {
          if (target.current && window.turnstile) {
            window.turnstile.render(target.current, {
              sitekey: siteKey,
              callback: setToken,
              'expired-callback': () => setToken(''),
              'error-callback': () => setToken(''),
            })
          }
        }}
      />
      <div ref={target} />
      <input type="hidden" name="captchaToken" value={token} />
    </>
  )
}
