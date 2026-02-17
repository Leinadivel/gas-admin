'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
  const router = useRouter()
  const params = useSearchParams()

  useEffect(() => {
    const run = async () => {
      // In most setups Supabase will set the session automatically after redirect,
      // but calling getSession ensures cookies are read.
      await supabase.auth.getSession()

      const next = params.get('next') || '/dashboard'
      router.replace(next)
    }

    run()
  }, [params, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-sm opacity-70">Confirming…</div>
    </div>
  )
}
