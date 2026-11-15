'use client'

import { LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'

export default function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ redirectTo: '/' })}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
    >
      <LogOut size={17} />
      Sign out
    </button>
  )
}
