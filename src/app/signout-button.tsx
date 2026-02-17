'use client'

import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export function SignOutButton() {
  const router = useRouter()

  const onSignOut = async () => {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  return (
    <button
      onClick={onSignOut}
      className="rounded-md border bg-white px-3 py-2 text-sm hover:bg-gray-50"
    >
      Sign out
    </button>
  )
}
