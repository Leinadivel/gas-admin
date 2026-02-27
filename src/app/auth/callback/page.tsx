'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [msg, setMsg] = useState('Completing sign-in...')

  useEffect(() => {
    const run = async () => {
      try {
        // Hash fragment contains access_token, refresh_token, etc.
        const hash = window.location.hash
        if (!hash || hash.length < 2) {
          // If no hash, fallback to server handler route (handles ?code or ?token_hash)
          router.replace('/auth/callback') // hits route.ts
          return
        }

        const params = new URLSearchParams(hash.slice(1))
        const access_token = params.get('access_token')
        const refresh_token = params.get('refresh_token')

        if (!access_token || !refresh_token) {
          setMsg('Missing session tokens. Please try the link again.')
          router.replace('/login')
          return
        }

        // Use anon client (browser) to set session
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        const { error: setErr } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        })

        if (setErr) {
          setMsg(setErr.message)
          router.replace('/login')
          return
        }

        // Now we have a session, detect driver
        const {
          data: { user },
          error: userErr,
        } = await supabase.auth.getUser()

        if (userErr || !user?.id) {
          router.replace('/login')
          return
        }

        const { data: staffRows } = await supabase
          .from('vendor_staff')
          .select('id, role, is_active')
          .eq('user_id', user.id)
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

        // Default
        router.replace('/dashboard')
      } catch (e: any) {
        router.replace('/login')
      }
    }

    run()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-xl border bg-white p-6 text-center space-y-2">
        <div className="text-lg font-semibold">{msg}</div>
        <div className="text-sm opacity-70">You can close this page once it finishes.</div>
      </div>
    </div>
  )
}