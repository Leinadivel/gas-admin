'use client'

import Link from 'next/link'
import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { ArrowLeft, Lock, LogIn, Mail, ShieldCheck, Store } from 'lucide-react'

function VendorLoginInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const next = searchParams.get('next') || '/vendor/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (signInError) throw signInError

      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser()
      if (userErr) throw userErr
      if (!user) throw new Error('No session found')

      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('role,is_admin')
        .eq('id', user.id)
        .maybeSingle()

      if (profileErr) throw profileErr

      if (profile?.is_admin) {
        router.replace('/dashboard')
        return
      }

      if (profile?.role !== 'vendor') {
        await supabase.auth.signOut()
        throw new Error('Access denied. This login is for vendors only.')
      }

      router.replace(next)
    } catch (err: any) {
      setError(err?.message ?? 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10 sm:px-6 lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:px-8">
        <div className="hidden lg:block">
          <div className="max-w-md">
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
                <span className="text-base font-extrabold">G</span>
              </span>
              <div className="leading-tight">
                <div className="text-base font-extrabold tracking-tight text-gray-900">24hrsGas</div>
                <div className="text-xs font-medium text-gray-500">Vendor Portal</div>
              </div>
            </Link>

            <div className="mt-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                <ShieldCheck size={14} />
                Secure vendor access
              </div>

              <h1 className="mt-5 text-4xl font-semibold tracking-tight text-gray-900">
                Manage orders, vehicles, drivers, and payouts in one place.
              </h1>

              <p className="mt-4 text-base leading-7 text-gray-600">
                Sign in to access your vendor dashboard, monitor fleet activity, handle bookings,
                track wallet balance, and keep your documents up to date.
              </p>

              <div className="mt-8 grid gap-4">
                <div className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm backdrop-blur">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-blue-100 p-2 text-blue-600">
                      <Store size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">Built for vendors</div>
                      <div className="mt-1 text-sm text-gray-600">
                        Access tools designed for dispatch, fleet management, compliance, and
                        payouts.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm backdrop-blur">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-orange-100 p-2 text-orange-600">
                      <LogIn size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">Fast and simple</div>
                      <div className="mt-1 text-sm text-gray-600">
                        Get into your workspace quickly and continue where you left off.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full">
          <div className="mx-auto w-full max-w-md rounded-3xl border border-gray-200 bg-white p-6 shadow-[0_10px_40px_rgba(0,0,0,0.08)] sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-3 lg:hidden">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
                  <span className="text-sm font-extrabold">G</span>
                </span>
                <div className="leading-tight">
                  <div className="text-sm font-extrabold tracking-tight text-gray-900">GasGo</div>
                  <div className="text-[11px] text-gray-500">Vendor Portal</div>
                </div>
              </Link>

              <Link
                href="/"
                className="inline-flex items-center gap-2 text-xs font-semibold text-gray-600 transition hover:text-blue-600"
              >
                <ArrowLeft size={14} />
                Back to home
              </Link>
            </div>

            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
                Vendor Login
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Sign in to your vendor portal to manage your operations.
              </p>
            </div>

            <form onSubmit={onSubmit} className="mt-8 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Email</label>
                <div className="relative">
                  <Mail
                    size={18}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vendor@example.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <div className="relative">
                  <Lock
                    size={18}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <div className="space-y-3 pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <LogIn size={16} />
                  {loading ? 'Signing in…' : 'Sign in'}
                </button>

                <button
                  type="button"
                  onClick={() => router.push('/vendor/register')}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Create vendor account
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VendorLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-orange-50 px-4">
          <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 text-sm text-gray-500 shadow-sm">
            Loading…
          </div>
        </div>
      }
    >
      <VendorLoginInner />
    </Suspense>
  )
}