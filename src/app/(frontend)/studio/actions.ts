'use server'

import { getCurrentUser } from '@/lib/current-user'
import { getPayloadClient } from '@/lib/payload'

export type StudioState = {
  status: 'idle' | 'success' | 'error'
  message: string
  output?: string
}

export const initialStudioState: StudioState = { status: 'idle', message: '' }

const allowedTypes = [
  'landing-page',
  'campaign',
  'itinerary',
  'social',
  'inventory-enrichment',
  'pricing-intelligence',
  'trip-matching',
  'proposal',
  'support-assistant',
] as const

export async function generateProject(
  _previousState: StudioState,
  formData: FormData,
): Promise<StudioState> {
  const user = await getCurrentUser()
  if (!user) return { status: 'error', message: 'Sign in to use Masidy Make.' }
  const title = String(formData.get('title') ?? '').trim()
  const type = String(formData.get('type') ?? '')
  const prompt = String(formData.get('prompt') ?? '').trim()
  const template = String(formData.get('template') ?? 'editorial')
  const brandKit = String(formData.get('brandKit') ?? '')

  if (title.length < 3 || title.length > 120) {
    return { status: 'error', message: 'Give your project a clear title.' }
  }
  if (!allowedTypes.includes(type as (typeof allowedTypes)[number])) {
    return { status: 'error', message: 'Choose a valid project type.' }
  }
  if (prompt.length < 20 || prompt.length > 5000) {
    return {
      status: 'error',
      message: 'Describe what you need in at least 20 characters.',
    }
  }
  if (!process.env.APP_OPENAI_API_KEY) {
    return {
      status: 'error',
      message:
        'Masidy Make is fully wired. Add APP_OPENAI_API_KEY in Make Secrets to activate generation.',
    }
  }
  const payload = await getPayloadClient()
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const usageToday = await payload.find({
    collection: 'ai-usage',
    where: {
      and: [
        { owner: { equals: user.id } },
        { createdAt: { greater_than_equal: today.toISOString() } },
      ],
    },
    limit: 1,
    overrideAccess: true,
  })
  if (usageToday.totalDocs >= 20) {
    return {
      status: 'error',
      message: 'Daily generation limit reached. Try again tomorrow.',
    }
  }

  const [trips, orders, tickets] = await Promise.all([
    payload.find({
      collection: 'trips',
      user,
      overrideAccess: false,
      where: { status: { equals: 'active' } },
      limit: 20,
      depth: 0,
    }),
    payload.find({
      collection: 'orders',
      user,
      overrideAccess: false,
      limit: 20,
      depth: 0,
    }),
    payload.find({
      collection: 'support-tickets',
      user,
      overrideAccess: false,
      limit: 10,
      depth: 0,
    }),
  ])
  const workspaceContext = {
    role: user.role,
    trips: trips.docs.map((trip) => ({
      title: trip.title,
      destination: trip.destination,
      price: trip.price,
      currency: trip.currency,
      durationDays: trip.durationDays,
      commission: trip.agentCommission,
    })),
    orders: orders.docs.map((order) => ({
      reference: order.reference,
      status: order.status,
      travelers: order.travelers,
      total: order.total,
      currency: order.currency,
    })),
    support: tickets.docs.map((ticket) => ({
      subject: ticket.subject,
      status: ticket.status,
      priority: ticket.priority,
    })),
  }

  const instructions = `You are Masidy Make, an expert product, travel and growth designer.
Create a polished ${type.replace('-', ' ')} blueprint for a travel marketplace user.
Return concise, production-ready content with clear sections, headlines, calls to action,
visual direction, and implementation notes. Use only relevant facts from this private workspace
context and never expose unrelated customer data: ${JSON.stringify(workspaceContext)}.
Do not claim integrations or facts not supplied.`

  try {
    const moderation = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${process.env.APP_OPENAI_API_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ model: 'omni-moderation-latest', input: prompt }),
      signal: AbortSignal.timeout(20_000),
    })
    const moderationResult = (await moderation.json()) as {
      results?: Array<{ flagged?: boolean }>
    }
    if (!moderation.ok || moderationResult.results?.[0]?.flagged) {
      await payload.create({
        collection: 'ai-usage',
        overrideAccess: true,
        draft: false,
        data: {
          owner: user.id,
          model: 'omni-moderation-latest',
          moderationFlagged: true,
          status: 'blocked',
        },
      })
      return {
        status: 'error',
        message: 'This request was blocked by content safety controls.',
      }
    }
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${process.env.APP_OPENAI_API_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        instructions,
        input: prompt,
      }),
      signal: AbortSignal.timeout(60_000),
    })
    if (!response.ok) throw new Error(`OpenAI request failed with ${response.status}`)
    const result = (await response.json()) as {
      output_text?: string
      output?: Array<{ content?: Array<{ text?: string }> }>
      usage?: { input_tokens?: number; output_tokens?: number }
    }
    const output =
      result.output_text ||
      result.output
        ?.flatMap((item) => item.content ?? [])
        .map((item) => item.text ?? '')
        .join('\n')
        .trim()
    if (!output) throw new Error('The generation returned no content.')

    const paragraphs = output
      .split(/\n{2,}/)
      .map((part) => part.trim())
      .filter(Boolean)
    const project = await payload.create({
      collection: 'ai-projects',
      overrideAccess: false,
      user,
      draft: false,
      data: {
        title,
        type: type as (typeof allowedTypes)[number],
        prompt,
        generatedContent: { text: output },
        template: ['editorial', 'immersive', 'minimal', 'campaign'].includes(template)
          ? template
          : 'editorial',
        brandKit: brandKit || undefined,
        sections: paragraphs.slice(0, 8).map((sectionBody, index) => ({
          type: index === 0 ? 'hero' : index === paragraphs.length - 1 ? 'cta' : 'text',
          heading:
            sectionBody
              .split('\n')[0]
              ?.replace(/^#+\s*/, '')
              .slice(0, 220) || `Section ${index + 1}`,
          body: sectionBody,
        })),
        status: 'ready',
      } as never,
    })
    const inputTokens = result.usage?.input_tokens ?? 0
    const outputTokens = result.usage?.output_tokens ?? 0
    await payload.create({
      collection: 'ai-usage',
      overrideAccess: true,
      draft: false,
      data: {
        owner: user.id,
        project: project.id,
        model: 'gpt-4.1-mini',
        inputTokens,
        outputTokens,
        estimatedCostUsd:
          Math.round((inputTokens * 0.0000004 + outputTokens * 0.0000016) * 100000) / 100000,
        moderationFlagged: false,
        status: 'completed',
      },
    })

    return {
      status: 'success',
      message: 'Project generated and saved to your workspace.',
      output,
    }
  } catch {
    return {
      status: 'error',
      message: 'Generation failed. Check the AI key and try again.',
    }
  }
}

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export async function createBrandKit(
  _previousState: StudioState,
  formData: FormData,
): Promise<StudioState> {
  const user = await getCurrentUser()
  if (!user) return { status: 'error', message: 'Sign in to continue.' }
  const name = String(formData.get('name') ?? '').trim()
  const tone = String(formData.get('tone') ?? '').trim()
  const primaryColor = String(formData.get('primaryColor') ?? '')
  const accentColor = String(formData.get('accentColor') ?? '')
  const color = /^#[0-9a-f]{6}$/i
  if (
    name.length < 2 ||
    tone.length < 10 ||
    !color.test(primaryColor) ||
    !color.test(accentColor)
  ) {
    return { status: 'error', message: 'Check the brand name, tone, and colors.' }
  }
  try {
    const payload = await getPayloadClient()
    await payload.create({
      collection: 'brand-kits',
      user,
      overrideAccess: false,
      draft: false,
      data: { name, tone, primaryColor, accentColor } as never,
    })
    return { status: 'success', message: 'Brand kit saved.' }
  } catch {
    return { status: 'error', message: 'The brand kit could not be saved.' }
  }
}

export async function saveProject(
  _previousState: StudioState,
  formData: FormData,
): Promise<StudioState> {
  const user = await getCurrentUser()
  if (!user) return { status: 'error', message: 'Sign in to continue.' }
  const id = String(formData.get('id') ?? '')
  const slug = String(formData.get('slug') ?? '')
    .trim()
    .toLowerCase()
  const publish = formData.get('publish') === 'true'
  const template = String(formData.get('template') ?? 'editorial')
  const brandKit = String(formData.get('brandKit') ?? '')
  let sections: Array<{
    type: 'hero' | 'text' | 'features' | 'quote' | 'cta'
    eyebrow?: string
    heading: string
    body: string
    ctaLabel?: string
    ctaHref?: string
  }> = []
  try {
    const parsed = JSON.parse(String(formData.get('sections') ?? '[]')) as unknown
    if (!Array.isArray(parsed)) throw new Error('Invalid sections')
    sections = parsed.slice(0, 30).map((section) => {
      const value = section as Record<string, unknown>
      const type = String(value.type)
      if (!['hero', 'text', 'features', 'quote', 'cta'].includes(type)) {
        throw new Error('Invalid section type')
      }
      return {
        type: type as (typeof sections)[number]['type'],
        eyebrow: String(value.eyebrow ?? '').slice(0, 120) || undefined,
        heading: String(value.heading ?? '')
          .trim()
          .slice(0, 240),
        body: String(value.body ?? '')
          .trim()
          .slice(0, 5000),
        ctaLabel: String(value.ctaLabel ?? '').slice(0, 80) || undefined,
        ctaHref: String(value.ctaHref ?? '').slice(0, 300) || undefined,
      }
    })
  } catch {
    return { status: 'error', message: 'The page sections are invalid.' }
  }
  if (
    !id ||
    !slugPattern.test(slug) ||
    sections.length === 0 ||
    sections.some((section) => section.heading.length < 3 || section.body.length < 20)
  ) {
    return { status: 'error', message: 'Check the page URL and every section.' }
  }
  try {
    const payload = await getPayloadClient()
    const current = await payload.findByID({
      collection: 'ai-projects',
      id,
      user,
      overrideAccess: false,
    })
    await payload.update({
      collection: 'ai-projects',
      id,
      user,
      overrideAccess: false,
      data: {
        slug,
        sections,
        template: ['editorial', 'immersive', 'minimal', 'campaign'].includes(template)
          ? (template as 'editorial' | 'immersive' | 'minimal' | 'campaign')
          : 'editorial',
        brandKit: brandKit || null,
        status: publish ? 'published' : 'ready',
        publishedAt: publish ? new Date().toISOString() : current.publishedAt,
        versions: [
          ...(current.versions ?? []),
          {
            savedAt: new Date().toISOString(),
            label: publish ? 'Published' : 'Saved draft',
            sections,
          },
        ].slice(-50),
      },
    })
    return {
      status: 'success',
      message: publish ? 'Page published.' : 'Draft and version saved.',
    }
  } catch {
    return { status: 'error', message: 'The page could not be saved.' }
  }
}
