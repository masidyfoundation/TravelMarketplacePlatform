import { Globe2 } from 'lucide-react'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/current-user'
import { savePreferences } from './actions'

export default async function PreferencesPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  return (
    <div>
      <p className="text-xs font-extrabold uppercase tracking-[.16em] text-[#0b8da8]">
        Regional settings
      </p>
      <h1 className="mt-3 text-4xl font-black tracking-[-.05em]">Preferences</h1>
      <section className="mt-8 max-w-2xl rounded-[26px] border border-slate-100 bg-white p-6 shadow-sm">
        <Globe2 className="text-[#0b8da8]" />
        <form action={savePreferences} className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-extrabold text-slate-500">
            Language
            <select
              name="locale"
              defaultValue={user.locale ?? 'en'}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
              <option value="it">Italiano</option>
              <option value="pt">Português</option>
              <option value="ar">العربية</option>
              <option value="ja">日本語</option>
            </select>
          </label>
          <label className="text-xs font-extrabold text-slate-500">
            Currency
            <select
              name="preferredCurrency"
              defaultValue={user.preferredCurrency ?? 'USD'}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"
            >
              {['USD', 'EUR', 'GBP', 'AED'].map((code) => (
                <option key={code}>{code}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-extrabold text-slate-500 sm:col-span-2">
            IANA time zone
            <input
              name="timeZone"
              defaultValue={user.timeZone ?? 'UTC'}
              placeholder="Europe/Paris"
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"
            />
          </label>
          <button className="rounded-xl bg-[#0b2e4a] px-5 py-3 text-xs font-extrabold text-white">
            Save preferences
          </button>
        </form>
      </section>
    </div>
  )
}
