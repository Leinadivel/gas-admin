'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function VendorNewDriverPage() {
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
        body: JSON.stringify({ email: email.trim(), role }),
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error ?? 'Failed to invite driver.')

      setSuccess('Invite sent. Driver should check email (spam too) to set password.')
      setEmail('')
      setRole('driver')
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Add driver</h1>
        <p className="text-sm opacity-70">Invite a driver by email.</p>
      </div>

      {error ? (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700">
          {success}
        </div>
      ) : null}

      <form onSubmit={onInvite} className="rounded-xl border bg-white p-4 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Driver email</label>
          <input
            className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="driver@email.com"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Role</label>
          <select
            className="w-full rounded-md border px-3 py-2 bg-white"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="driver">driver</option>
            <option value="dispatcher">dispatcher</option>
            <option value="manager">manager</option>
          </select>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-black text-white px-4 py-2 text-sm disabled:opacity-60"
          >
            {loading ? 'Inviting…' : 'Send invite'}
          </button>

          <Link
            href="/vendor/drivers"
            className="rounded-md border bg-white px-4 py-2 text-sm hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>
      </form>

      <div className="text-xs opacity-60">
        This creates an Auth user (invite) and inserts into <code>vendor_staff</code>.
      </div>
    </div>
  )
}
