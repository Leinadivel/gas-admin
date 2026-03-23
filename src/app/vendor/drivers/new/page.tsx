'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Mail, Send, ShieldCheck, UserPlus, UserRound } from 'lucide-react'

export default function VendorNewDriverPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('driver')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const onInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const res = await fetch('/api/vendor/invite-driver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim(),
          role,
        }),
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error ?? 'Failed to invite driver.')

      setSuccess('Invite sent. Driver should check email (spam too) to set password.')
      setFullName('')
      setEmail('')
      setRole('driver')
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col gap-4">
        <Link
          href="/vendor/drivers"
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 transition hover:border-blue-200 hover:text-blue-600"
        >
          <ArrowLeft size={16} />
          Back to drivers
        </Link>

        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-blue-100 p-3 text-blue-600">
            <UserPlus size={22} />
          </div>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
              Add driver
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Invite a new team member to your vendor account with their name, email, and role.
            </p>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <form
          onSubmit={onInvite}
          className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="mb-6">
            <h2 className="text-base font-semibold text-gray-900">Driver details</h2>
            <p className="mt-1 text-sm text-gray-500">
              Enter the information below to send an invitation email.
            </p>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Driver name</label>
              <div className="relative">
                <UserRound
                  size={18}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Okafor"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Driver email</label>
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
                  placeholder="driver@email.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Role</label>
              <select
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="driver">driver</option>
                <option value="dispatcher">dispatcher</option>
                <option value="manager">manager</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 border-t border-gray-100 pt-5 sm:flex-row">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send size={16} />
              {loading ? 'Inviting…' : 'Send invite'}
            </button>

            <Link
              href="/vendor/drivers"
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </Link>
          </div>
        </form>

        <div className="space-y-4">
          <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <div className="rounded-xl bg-blue-100 p-2 text-blue-600">
                <ShieldCheck size={18} />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Invite flow</h3>
            </div>

            <div className="space-y-3 text-sm text-gray-600">
              <div className="rounded-xl border border-white/80 bg-white/80 p-3">
                Add the driver’s full name and active email address.
              </div>
              <div className="rounded-xl border border-white/80 bg-white/80 p-3">
                Choose the correct role for how they’ll use the platform.
              </div>
              <div className="rounded-xl border border-white/80 bg-white/80 p-3">
                An invite email will be sent so they can set their password and join your team.
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-orange-100 bg-orange-50 p-5">
            <h3 className="text-sm font-semibold text-gray-900">Helpful note</h3>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Ask the driver to check both inbox and spam folders after the invite is sent.
              This creates a new driver for your company.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}