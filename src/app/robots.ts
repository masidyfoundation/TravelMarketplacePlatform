import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/dashboard', '/studio', '/api'],
    },
    ...(base ? { sitemap: new URL('/sitemap.xml', base).toString() } : {}),
  }
}
