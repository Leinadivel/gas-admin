'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Lock,
  Mail,
  ShieldCheck,
  Store,
  UserPlus,
} from 'lucide-react'

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
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin

      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${siteUrl}/auth/callback?next=/vendor/login`,
          data: {
            app_role: 'vendor',
            business_name: companyName.trim(),
          },
        },
      })

      if (signUpError) throw signUpError

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
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700">
                <ShieldCheck size={14} />
                Start selling with confidence
              </div>

              <h1 className="mt-5 text-4xl font-semibold tracking-tight text-gray-900">
                Create your vendor account and start managing your operations professionally.
              </h1>

              <p className="mt-4 text-base leading-7 text-gray-600">
                Join the vendor portal to manage bookings, vehicles, drivers, wallet payouts, and
                business documents from one clean dashboard.
              </p>

              <div className="mt-8 grid gap-4">
                <div className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm backdrop-blur">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-blue-100 p-2 text-blue-600">
                      <Store size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">Vendor workspace</div>
                      <div className="mt-1 text-sm text-gray-600">
                        Access your full vendor dashboard after registration and verification.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm backdrop-blur">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-orange-100 p-2 text-orange-600">
                      <CheckCircle2 size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">Simple onboarding</div>
                      <div className="mt-1 text-sm text-gray-600">
                        Create your account, verify your email, and sign in to continue setup.
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
                Vendor Registration
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Create your vendor company account and get started.
              </p>
            </div>

            <form onSubmit={onSubmit} className="mt-8 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Company name</label>
                <div className="relative">
                  <Building2
                    size={18}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. GasGo Partners Ltd"
                    required
                  />
                </div>
              </div>

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
                    placeholder="vendor@company.com"
                    autoComplete="email"
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
                    placeholder="Minimum 8 characters"
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>

              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              {success ? (
                <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                  {success}
                </div>
              ) : null}

              <div className="space-y-3 pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <UserPlus size={16} />
                  {loading ? 'Creating…' : 'Create vendor account'}
                </button>

                <button
                  type="button"
                  onClick={() => router.push('/vendor/login')}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  I already have an account
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}