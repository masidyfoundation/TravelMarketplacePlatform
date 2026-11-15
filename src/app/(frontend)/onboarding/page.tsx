import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, BadgeCheck, CircleAlert, Clock3, ShieldCheck, Users } from 'lucide-react'
import { getCurrentUser } from '@/lib/current-user'
import { getPayloadClient } from '@/lib/payload'
import ApplicationForm from './application-form'

export const dynamic = 'force-dynamic'

export default async function OnboardingPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  const payload = await getPayloadClient()
  const applications = await payload.find({
    collection: 'applications',
    user,
    overrideAccess: false,
    limit: 1,
    sort: '-updatedAt',
  })
  const application = applications.docs[0]
  const applicationStatus = application?.status ?? 'submitted'
  const canResubmit = application && ['changes-requested', 'declined'].includes(applicationStatus)
  const statusCopy = application
    ? {
        submitted: {
          label: 'Submitted',
          text: 'Your application is in the trust team queue.',
          color: 'bg-sky-50 text-sky-700',
          icon: Clock3,
        },
        review: {
          label: 'In review',
          text: 'The trust team is reviewing your partner details.',
          color: 'bg-amber-50 text-amber-700',
          icon: Clock3,
        },
        approved: {
          label: 'Approved',
          text: 'Your verified partner workspace is active.',
          color: 'bg-emerald-50 text-emerald-700',
          icon: BadgeCheck,
        },
        'changes-requested': {
          label: 'Changes requested',
          text: 'Update the information below and resubmit it for review.',
          color: 'bg-orange-50 text-orange-700',
          icon: CircleAlert,
        },
        declined: {
          label: 'Not approved',
          text: 'You can revise your application and submit it again.',
          color: 'bg-rose-50 text-rose-700',
          icon: CircleAlert,
        },
      }[applicationStatus]
    : null

  return (
    <main className="min-h-screen bg-[#f5f7f7] px-5 py-8 text-[#0b2944] sm:px-8 lg:py-12">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-extrabold text-slate-500"
        >
          <ArrowLeft size={15} />
          Back to dashboard
        </Link>
        <div className="mt-8 grid gap-8 lg:grid-cols-[.75fr_1.25fr]">
          <section className="rounded-[30px] bg-[#0b2e4a] p-7 text-white sm:p-9">
            <p className="text-xs font-extrabold uppercase tracking-[.16em] text-[#6fdde4]">
              Masidy partner verification
            </p>
            <h1 className="mt-4 text-4xl font-black leading-[1.02] tracking-[-.055em]">
              Build trust before you start selling.
            </h1>
            <p className="mt-5 text-sm leading-7 text-white/55">
              Every agent and agency enters the same structured review process. This protects
              travelers, suppliers, payments, and your reputation.
            </p>
            <div className="mt-8 space-y-4">
              {[
                [BadgeCheck, 'Identity and business review'],
                [ShieldCheck, 'Marketplace standards check'],
                [Users, 'Role and team access setup'],
              ].map(([Icon, label]) => {
                const BenefitIcon = Icon as typeof BadgeCheck
                return (
                  <div
                    key={String(label)}
                    className="flex items-center gap-3 text-sm font-bold text-white/75"
                  >
                    <span className="grid size-10 place-items-center rounded-xl bg-white/10 text-[#6fdde4]">
                      <BenefitIcon size={18} />
                    </span>
                    {String(label)}
                  </div>
                )
              })}
            </div>
          </section>
          <section className="rounded-[30px] border border-slate-100 bg-white p-6 shadow-sm sm:p-9">
            <p className="text-xs font-extrabold uppercase tracking-[.15em] text-[#0b8da8]">
              Partner application
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-[-.045em]">
              Tell us about your travel business.
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Signed in as {user.email}. Operational notes remain private to the Masidy trust team.
            </p>
            {application && statusCopy && (
              <div className={`mt-6 flex gap-3 rounded-2xl p-4 ${statusCopy.color}`}>
                <statusCopy.icon className="mt-0.5 shrink-0" size={20} />
                <div>
                  <p className="text-sm font-extrabold">{statusCopy.label}</p>
                  <p className="mt-1 text-xs leading-5 opacity-80">{statusCopy.text}</p>
                  <p className="mt-2 text-[11px] font-bold opacity-65">
                    Updated {new Date(application.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
            {(!application || canResubmit) && (
              <div className="mt-7">
                <ApplicationForm
                  application={
                    application
                      ? {
                          type: application.type,
                          businessName: application.businessName,
                          country: application.country,
                          phone: application.phone,
                          website: application.website ?? '',
                          specialties:
                            application.specialties
                              ?.map((specialty) => specialty.name)
                              .join(', ') ?? '',
                          experience: application.experience,
                        }
                      : undefined
                  }
                />
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
