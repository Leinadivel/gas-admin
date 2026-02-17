'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

type VendorRow = {
  id: string
  business_name: string | null
}

type OrderRow = {
  id: string
  status: string
  location: string | null
  total_amount: number | null
  payment_status: string | null
  created_at: string
}

const STATUS_FILTERS = [
  'all',
  'pending',
  'accepted',
  'enroute',
  'arrived',
  'awaiting_payment',
  'paid',
  'completed',
]

export default function VendorBookingsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [vendor, setVendor] = useState<VendorRow | null>(null)
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return orders
    return orders.filter((o) => o.status === statusFilter)
  }, [orders, statusFilter])

  useEffect(() => {
    let mounted = true

    const load = async () => {
      setLoading(true)
      setError(null)

      const { data: userData, error: userErr } = await supabase.auth.getUser()
      if (userErr) {
        if (mounted) {
          setError(userErr.message)
          setLoading(false)
        }
        return
      }

      const authId = userData.user?.id
      if (!authId) {
        if (mounted) {
          setError('Not logged in')
          setLoading(false)
        }
        return
      }

      // Find vendor
      const { data: vendorRow, error: vendorErr } = await supabase
        .from('vendors')
        .select('id,business_name')
        .or(`id.eq.${authId},user_id.eq.${authId},profile_id.eq.${authId}`)
        .maybeSingle()

      if (!mounted) return

      if (vendorErr) {
        setError(vendorErr.message)
        setLoading(false)
        return
      }

      if (!vendorRow) {
        setError('Vendor profile not found.')
        setLoading(false)
        return
      }

      const v = vendorRow as VendorRow
      setVendor(v)

      // Fetch orders belonging to this vendor
      const { data: rows, error: ordersErr } = await supabase
        .from('orders')
        .select('id,status,location,total_amount,payment_status,created_at')
        .eq('vendor_id', v.id)
        .order('created_at', { ascending: false })
        .limit(200)

      if (!mounted) return

      if (ordersErr) {
        setError(ordersErr.message)
        setOrders([])
      } else {
        setOrders((rows ?? []) as OrderRow[])
      }

      setLoading(false)
    }

    load()

    const ch = supabase
      .channel('vendor-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, load)
      .subscribe()

    return () => {
      mounted = false
      supabase.removeChannel(ch)
    }
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Bookings</h1>
          <p className="text-sm opacity-70">
            {vendor?.business_name ?? 'Vendor'} orders
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border bg-white px-3 py-2 text-sm"
        >
          {STATUS_FILTERS.map((s) => (
            <option key={s} value={s}>
              {s.toUpperCase()}
            </option>
          ))}
        </select>
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
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Location</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-6 opacity-70" colSpan={6}>
                  Loading…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td className="px-4 py-6 opacity-70" colSpan={6}>
                  No bookings found.
                </td>
              </tr>
            ) : (
              filtered.map((o) => (
                <tr key={o.id} className="border-b last:border-b-0">
                  <td className="px-4 py-3 whitespace-nowrap">
                    {o.created_at
                      ? new Date(o.created_at).toLocaleString()
                      : '—'}
                  </td>

                  <td className="px-4 py-3 font-mono">
                    <Link
                      href={`/vendor/bookings/${o.id}`}
                      className="underline underline-offset-2 hover:opacity-80"
                    >
                      {o.id}
                    </Link>
                  </td>

                  <td className="px-4 py-3">{o.status}</td>
                  <td className="px-4 py-3">{o.payment_status ?? '—'}</td>
                  <td className="px-4 py-3">
                    {o.total_amount ? `₦${o.total_amount}` : '—'}
                  </td>
                  <td className="px-4 py-3">{o.location ?? '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="text-xs opacity-60">
        Click Order ID to view booking details (next step).
      </div>
    </div>
  )
}
