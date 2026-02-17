'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

type VendorRow = {
  id: string
  profile_id: string
  business_name: string | null
  Vehicle_type: string | null
  available: boolean
  wallet_balance: number
  balance: number
  bank_name: string | null
  account_number: string | null
  account_name: string | null
  last_lat: number | null
  last_lng: number | null
  last_seen_at: string | null
  is_online: boolean
  created_at: string
}

export default function AdminVendorsPage() {
  const [loading, setLoading] = useState(true)
  const [vendors, setVendors] = useState<VendorRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return vendors
    return vendors.filter((v) => {
      const hay = [
        v.id,
        v.profile_id,
        v.business_name ?? '',
        v.Vehicle_type ?? '',
        v.bank_name ?? '',
        v.account_number ?? '',
      ]
        .join(' ')
        .toLowerCase()
      return hay.includes(query)
    })
  }, [vendors, q])

  useEffect(() => {
    let mounted = true

    const load = async () => {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('vendors')
        .select(
          'id,profile_id,business_name,Vehicle_type,available,wallet_balance,balance,bank_name,account_number,account_name,last_lat,last_lng,last_seen_at,is_online,created_at'
        )
        .order('created_at', { ascending: false })
        .limit(200)

      if (!mounted) return

      if (error) {
        setError(error.message)
        setVendors([])
      } else {
        setVendors((data ?? []) as VendorRow[])
      }

      setLoading(false)
    }

    load()

    const channel = supabase
      .channel('admin-vendors')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'vendors' },
        () => load()
      )
      .subscribe()

    return () => {
      mounted = false
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Vendors</h1>
          <p className="text-sm opacity-70">Latest 200 vendors (realtime).</p>
        </div>

        <input
          className="w-full sm:w-80 rounded-md border bg-white px-3 py-2 outline-none focus:ring-2"
          placeholder="Search: business, profile_id, vehicle, bank, account…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {error ? (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="min-w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr className="text-left">
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Vendor ID</th>
              <th className="px-4 py-3">Profile ID</th>
              <th className="px-4 py-3">Business</th>
              <th className="px-4 py-3">Vehicle</th>
              <th className="px-4 py-3">Online</th>
              <th className="px-4 py-3">Available</th>
              <th className="px-4 py-3">Wallet</th>
              <th className="px-4 py-3">Balance</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-6 opacity-70" colSpan={9}>
                  Loading…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td className="px-4 py-6 opacity-70" colSpan={9}>
                  No vendors found.
                </td>
              </tr>
            ) : (
              filtered.map((v) => (
                <tr key={v.id} className="border-b last:border-b-0">
                  <td className="px-4 py-3 whitespace-nowrap">
                    {v.created_at ? new Date(v.created_at).toLocaleString() : '—'}
                  </td>

                  <td className="px-4 py-3 font-mono">
                    <Link
                      href={`/vendors/${v.id}`}
                      className="underline underline-offset-2 hover:opacity-80"
                    >
                      {v.id}
                    </Link>
                  </td>

                  <td className="px-4 py-3 font-mono">{v.profile_id}</td>
                  <td className="px-4 py-3">{v.business_name ?? '—'}</td>
                  <td className="px-4 py-3">{v.Vehicle_type ?? '—'}</td>
                  <td className="px-4 py-3">{v.is_online ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-3">{v.available ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-3">{String(v.wallet_balance)}</td>
                  <td className="px-4 py-3">{String(v.balance)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="text-xs opacity-60">
        Click Vendor ID to open details (<code>/vendors/[id]</code>).
      </div>
    </div>
  )
}
