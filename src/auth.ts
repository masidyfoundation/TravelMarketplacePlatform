import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Resend from 'next-auth/providers/resend'
import type { Provider } from 'next-auth/providers'
import { payloadAuthAdapter } from '@/lib/auth-adapter'
import {
  CSRF_COOKIE,
  SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
  SESSION_MAX_AGE,
} from '@/lib/session-cookie'
import { getPayloadClient } from '@/lib/payload'

if (
  !process.env.AUTH_URL &&
  process.env.NEXT_PUBLIC_SITE_URL &&
  !process.env.NEXT_PUBLIC_SITE_URL.includes('localhost')
) {
  process.env.AUTH_URL = process.env.NEXT_PUBLIC_SITE_URL
}

const providers: Provider[] = []

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  )
}

if (process.env.AUTH_RESEND_KEY && process.env.EMAIL_FROM) {
  providers.push(
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY,
      from: process.env.EMAIL_FROM,
    }),
  )
}

export const authProviders = {
  google: Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET),
  email: Boolean(process.env.AUTH_RESEND_KEY && process.env.EMAIL_FROM),
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: payloadAuthAdapter,
  trustHost: true,
  providers,
  pages: {
    signIn: '/login',
    verifyRequest: '/login?sent=1',
    error: '/login?error=1',
  },
  session: {
    strategy: 'jwt',
    maxAge: SESSION_MAX_AGE,
  },
  cookies: {
    sessionToken: { name: SESSION_COOKIE, options: SESSION_COOKIE_OPTIONS },
    csrfToken: { name: CSRF_COOKIE, options: SESSION_COOKIE_OPTIONS },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) token.userId = user.id
      if (token.userId && !token.role) {
        const payload = await getPayloadClient()
        try {
          const appUser = await payload.findByID({
            collection: 'users',
            id: String(token.userId),
            overrideAccess: true,
          })
          token.role = appUser.role
        } catch {
          token.role = 'traveler'
        }
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.userId ?? token.sub ?? '')
        session.user.role =
          token.role === 'agent' || token.role === 'agency' ? token.role : 'traveler'
      }
      return session
    },
  },
})
