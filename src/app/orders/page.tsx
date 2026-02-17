'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

type OrderRow = {
  id: string
  status: string
  user_id: string | null
  vendor_id: string | null
  location: string | null
  cylinder_size: string | null
  quantity: number | null
  created_at: string | null
}

type ProfileRow = {
  id: string
  full_name: string | null
}

type VendorRow = {
  id: string
  business_name: string | null
}

const STATUS_ORDER = [
  'pending',
  'accepted',
  'enroute',
  'arrived',
  'awaiting_payment',
  'paid',
  'completed',
  'cancelled',
]

export default function AdminOrdersPage() {
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [error, setError] = useState<string | null>(null)

  // Lookup maps
  const [profileNameById, setProfileNameById] = useState<Record<string, string>>(
    {}
  )
  const [vendorBizById, setVendorBizById] = useState<Record<string, string>>({})

  const [q, setQ] = useState('')
  const [status, setStatus] = useState<string>('all')

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return orders.filter((o) => {
      const matchesStatus = status === 'all' ? true : o.status === status

      const userName = o.user_id ? profileNameById[o.user_id] ?? '' : ''
      const vendorBiz = o.vendor_id ? vendorBizById[o.vendor_id] ?? '' : ''

      const haystack = [
        o.id,
        o.status,
        o.user_id ?? '',
        userName,
        o.vendor_id ?? '',
        vendorBiz,
        o.location ?? '',
        o.cylinder_size ?? '',
      ]
        .join(' ')
        .toLowerCase()

      const matchesQuery = query ? haystack.includes(query) : true
      return matchesStatus && matchesQuery
    })
  }, [orders, q, status, profileNameById, vendorBizById])

  useEffect(() => {
    let mounted = true

    const load = async () => {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('orders')
        .select('id,status,user_id,vendor_id,location,cylinder_size,quantity,created_at')
        .order('created_at', { ascending: false })
        .limit(200)

      if (!mounted) return

      if (error) {
        setError(error.message)
        setOrders([])
        setProfileNameById({})
        setVendorBizById({})
        setLoading(false)
        return
      }

      const rows = (data ?? []) as OrderRow[]
      setOrders(rows)

      // Build unique ids for lookup
      const userIds = Array.from(
        new Set(rows.map((r) => r.user_id).filter(Boolean) as string[])
      )
      const vendorIds = Array.from(
        new Set(rows.map((r) => r.vendor_id).filter(Boolean) as string[])
      )

      // Fetch names in parallel (safe + minimal)
      const [profilesRes, vendorsRes] = await Promise.all([
        userIds.length
          ? supabase
              .from('profiles')
              .select('id,full_name')
              .in('id', userIds)
          : Promise.resolve({ data: [] as any[], error: null as any }),
        vendorIds.length
          ? supabase
              .from('vendors')
              .select('id,business_name')
              .in('id', vendorIds)
          : Promise.resolve({ data: [] as any[], error: null as any }),
      ])

      if (!mounted) return

      if (profilesRes.error) {
        setError((prev) => prev ?? profilesRes.error.message)
      } else {
        const map: Record<string, string> = {}
        ;((profilesRes.data ?? []) as ProfileRow[]).forEach((p) => {
          if (p.id) map[p.id] = p.full_name ?? ''
        })
        setProfileNameById(map)
      }

      if (vendorsRes.error) {
        setError((prev) => prev ?? vendorsRes.error.message)
      } else {
        const map: Record<string, string> = {}
        ;((vendorsRes.data ?? []) as VendorRow[]).forEach((v) => {
          if (v.id) map[v.id] = v.business_name ?? ''
        })
        setVendorBizById(map)
      }

      setLoading(false)
    }

    load()

    const channel = supabase
      .channel('admin-orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
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
          <h1 className="text-2xl font-semibold">Orders</h1>
          <p className="text-sm opacity-70">Latest 200 orders (realtime).</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            className="w-full sm:w-72 rounded-md border bg-white px-3 py-2 outline-none focus:ring-2"
            placeholder="Search id, status, name, vendor, location…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <select
            className="w-full sm:w-56 rounded-md border bg-white px-3 py-2 outline-none focus:ring-2"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">All statuses</option>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
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
              <th className="px-4 py-3">Order ID</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Vendor</th>
              <th className="px-4 py-3">Cylinder</th>
              <th className="px-4 py-3">Qty</th>
              <th className="px-4 py-3">Location</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-6 opacity-70" colSpan={8}>
                  Loading…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td className="px-4 py-6 opacity-70" colSpan={8}>
                  No orders found.
                </td>
              </tr>
            ) : (
              filtered.map((o) => {
                const userName =
                  o.user_id && profileNameById[o.user_id]
                    ? profileNameById[o.user_id]
                    : null
                const vendorBiz =
                  o.vendor_id && vendorBizById[o.vendor_id]
                    ? vendorBizById[o.vendor_id]
                    : null

                return (
                  <tr key={o.id} className="border-b last:border-b-0">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {o.created_at ? new Date(o.created_at).toLocaleString() : '—'}
                    </td>

                    <td className="px-4 py-3 font-mono">
                      <Link
                        href={`/orders/${o.id}`}
                        className="underline underline-offset-2 hover:opacity-80"
                      >
                        {o.id}
                      </Link>
                    </td>

                    <td className="px-4 py-3">{o.status}</td>

                    <td className="px-4 py-3">
                      <div className="font-medium">{userName ?? '—'}</div>
                      <div className="font-mono text-xs opacity-60">
                        {o.user_id ?? '—'}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-medium">{vendorBiz ?? '—'}</div>
                      <div className="font-mono text-xs opacity-60">
                        {o.vendor_id ?? '—'}
                      </div>
                    </td>

                    <td className="px-4 py-3">{o.cylinder_size ?? '—'}</td>
                    <td className="px-4 py-3">{o.quantity ?? '—'}</td>
                    <td className="px-4 py-3 max-w-[420px] truncate">
                      {o.location ?? '—'}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
