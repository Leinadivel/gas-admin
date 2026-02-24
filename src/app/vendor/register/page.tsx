'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function VendorRegisterPage() {
  const router = useRouter()

  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      // Use production URL if available
      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL || window.location.origin

      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${siteUrl}/auth/callback?next=/vendor/login`,

          // This will be read by the DB trigger
          data: {
            business_name: companyName.trim(),
          },
        },
      })

      if (signUpError) throw signUpError

      // Email confirmation is ON → do NOT sign in here
      setSuccess(
        'Account created successfully. Please check your email to verify your account, then log in.'
      )

      setCompanyName('')
      setEmail('')
      setPassword('')

      setTimeout(() => {
        router.replace('/vendor/login')
      }, 1000)

    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl border p-6 shadow-sm bg-white">
        <h1 className="text-xl font-semibold">Vendor Registration</h1>
        <p className="mt-1 text-sm opacity-70">
          Create your vendor company account.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Company name</label>
            <input
              className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. GasGo Partners Ltd"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <input
              className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vendor@company.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <input
              className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              autoComplete="new-password"
              required
            />
          </div>

          {error && (
            <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-800">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-black px-4 py-2 text-white disabled:opacity-60"
          >
            {loading ? 'Creating…' : 'Create vendor account'}
          </button>

          <button
            type="button"
            onClick={() => router.push('/vendor/login')}
            className="w-full rounded-md border px-4 py-2"
          >
            I already have an account
          </button>
        </form>
      </div>
    </div>
  )
}