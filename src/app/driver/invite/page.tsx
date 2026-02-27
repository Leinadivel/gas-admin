'use client'

import { useEffect, useMemo, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function DriverInviteSetPasswordPage() {
  const supabase = useMemo(() => {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }, [])

  const [checking, setChecking] = useState(true)
  const [authedEmail, setAuthedEmail] = useState<string | null>(null)

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    let mounted = true

    ;(async () => {
      try {
        if (!mounted) return
        setChecking(true)
        setError(null)

        // Prefer session check (more reliable), then getUser
        const { data: sess } = await supabase.auth.getSession()
        const sessionUser = sess.session?.user ?? null

        if (!sessionUser?.id) {
          const { data, error } = await supabase.auth.getUser()
          if (error || !data?.user) {
            if (!mounted) return
            setAuthedEmail(null)
            setChecking(false)
            return
          }

          if (!mounted) return
          setAuthedEmail(data.user.email ?? null)
          setChecking(false)
          return
        }

        if (!mounted) return
        setAuthedEmail(sessionUser.email ?? null)
        setChecking(false)
      } catch (e: any) {
        if (!mounted) return
        setAuthedEmail(null)
        setChecking(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [supabase])

  const onSetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw new Error(error.message)

      setDone(true)
      setPassword('')
      setConfirm('')
    } catch (err: any) {
      setError(err?.message ?? 'Failed to set password.')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="max-w-md space-y-2">
        <h1 className="text-2xl font-semibold">Set your password</h1>
        <p className="text-sm opacity-70">Checking invite session…</p>
      </div>
    )
  }

  if (!authedEmail) {
    return (
      <div className="max-w-md space-y-3">
        <h1 className="text-2xl font-semibold">Invite link invalid or expired</h1>
        <p className="text-sm opacity-70">Please ask your vendor to resend the invite.</p>
        <p className="text-xs opacity-60">
          Tip: open the newest invite email (check the timestamp). Invite links are one-time use.
        </p>
      </div>
    )
  }

  if (done) {
    return (
      <div className="max-w-md space-y-3">
        <h1 className="text-2xl font-semibold">Password set ✅</h1>
        <p className="text-sm opacity-70">You can now log into the Driver app using:</p>

        <div className="rounded-lg border bg-white p-3 text-sm">
          <div className="font-medium">Email</div>
          <div className="opacity-80">{authedEmail}</div>
        </div>

        <p className="text-sm opacity-70">
          Open the Driver app → Login → enter your email and the password you just set.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-md space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Set your password</h1>
        <p className="text-sm opacity-70">
          Welcome{authedEmail ? `, ${authedEmail}` : ''}. Create a password to use the Driver app.
        </p>
      </div>

      {error ? (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <form onSubmit={onSetPassword} className="rounded-xl border bg-white p-4 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">New password</label>
          <input
            className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 8 characters"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Confirm password</label>
          <input
            className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-black text-white px-4 py-2 text-sm disabled:opacity-60"
        >
          {loading ? 'Saving…' : 'Set password'}
        </button>
      </form>
    </div>
  )
}