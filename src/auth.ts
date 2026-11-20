import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
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

const googleClientId = process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID
const googleClientSecret = process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET

if (googleClientId && googleClientSecret) {
  providers.push(
    Google({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    }),
  )
}

export const authProviders = {
  google: Boolean(googleClientId && googleClientSecret),
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: payloadAuthAdapter,
  trustHost: true,
  providers,
  pages: {
    signIn: '/login',
    error: '/login',
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
      if (token.userId) {
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
