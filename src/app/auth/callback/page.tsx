'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [msg, setMsg] = useState('Completing sign-in...')

  const supabase = useMemo(() => {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }, [])

  useEffect(() => {
    const run = async () => {
      try {
        // If Supabase returns tokens in hash, handle on client
        const hash = window.location.hash
        if (hash && hash.length > 1) {
          const params = new URLSearchParams(hash.slice(1))
          const access_token = params.get('access_token')
          const refresh_token = params.get('refresh_token')

          if (access_token && refresh_token) {
            const { error: setErr } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            })

            if (setErr) {
              router.replace('/login')
              return
            }

            // ✅ Confirm session exists before routing
            const { data: sess } = await supabase.auth.getSession()
            const sessionUserId = sess.session?.user?.id ?? null

            if (!sessionUserId) {
              router.replace('/login')
              return
            }

            // ✅ Driver routing
            const { data: staffRows } = await supabase
              .from('vendor_staff')
              .select('id, role, is_active')
              .eq('user_id', sessionUserId)
              .order('created_at', { ascending: false })
              .limit(1)

            const staff = staffRows?.[0] ?? null
            if (
              staff &&
              staff.is_active === true &&
              (staff.role === 'driver' || staff.role === 'dispatcher' || staff.role === 'manager')
            ) {
              router.replace('/driver/invite')
              return
            }

            router.replace('/dashboard')
            return
          }
        }

        // Otherwise delegate to server handler for code/token_hash flows
        const qs = window.location.search || ''
        window.location.replace(`/auth/callback/server${qs}`)
      } catch {
        router.replace('/login')
      }
    }

    run()
  }, [router, supabase])

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-xl border bg-white p-6 text-center space-y-2">
        <div className="text-lg font-semibold">{msg}</div>
        <div className="text-sm opacity-70">When you’re done, please close this page.</div>
      </div>
    </div>
  )
}