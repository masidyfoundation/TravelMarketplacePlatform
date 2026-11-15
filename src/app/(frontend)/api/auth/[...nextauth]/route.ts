import { authProviders, handlers } from '@/auth'
import type { NextRequest } from 'next/server'

const configured = Boolean(process.env.AUTH_SECRET) && (authProviders.google || authProviders.email)

export async function GET(request: NextRequest) {
  if (configured) return handlers.GET(request)
  const pathname = new URL(request.url).pathname
  if (pathname.endsWith('/providers')) return Response.json({})
  if (pathname.endsWith('/session')) return Response.json(null)
  return Response.json(
    { error: 'Authentication is waiting for provider secrets.' },
    { status: 503 },
  )
}

export async function POST(request: NextRequest) {
  if (configured) return handlers.POST(request)
  return Response.json(
    { error: 'Authentication is waiting for provider secrets.' },
    { status: 503 },
  )
}
