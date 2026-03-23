'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { CalendarClock, ChevronRight, ClipboardList, CreditCard, MapPin } from 'lucide-react'

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

const statusBadgeMap: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
  accepted: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200',
  enroute: 'bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200',
  arrived: 'bg-cyan-50 text-cyan-700 ring-1 ring-inset ring-cyan-200',
  awaiting_payment: 'bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-200',
  paid: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
  completed: 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-200',
}

const paymentBadgeMap: Record<string, string> = {
  paid: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
  pending: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
  failed: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200',
  unpaid: 'bg-gray-100 text-gray-700 ring-1 ring-inset ring-gray-200',
}

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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-blue-100 p-3 text-blue-600">
            <ClipboardList size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Bookings</h1>
            <p className="mt-1 text-sm text-gray-500">
              {vendor?.business_name ?? 'Vendor'} orders and booking activity
            </p>
          </div>
        </div>

        <div className="w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:min-w-[220px]"
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s} value={s}>
                {s === 'all' ? 'All statuses' : s.replaceAll('_', ' ').toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <ClipboardList size={16} />
            Total bookings
          </div>
          <p className="mt-3 text-2xl font-semibold text-gray-900">
            {loading ? '—' : orders.length}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <CalendarClock size={16} />
            Filtered results
          </div>
          <p className="mt-3 text-2xl font-semibold text-gray-900">
            {loading ? '—' : filtered.length}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-orange-50 to-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <CreditCard size={16} />
            Current filter
          </div>
          <p className="mt-3 text-base font-semibold capitalize text-gray-900">
            {statusFilter === 'all' ? 'All statuses' : statusFilter.replaceAll('_', ' ')}
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-4 py-4 sm:px-6">
          <h2 className="text-sm font-semibold text-gray-900">Recent bookings</h2>
          <p className="mt-1 text-sm text-gray-500">
            Click any order ID to view full booking details.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3 sm:px-6">Created</th>
                <th className="px-4 py-3">Order ID</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3 sm:px-6">Location</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td className="px-4 py-10 text-center text-sm text-gray-500 sm:px-6" colSpan={6}>
                    Loading bookings...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td className="px-4 py-12 sm:px-6" colSpan={6}>
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="mb-3 rounded-full bg-gray-100 p-3 text-gray-400">
                        <ClipboardList size={22} />
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900">No bookings found</h3>
                      <p className="mt-1 max-w-sm text-sm text-gray-500">
                        There are no bookings for the selected filter right now.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((o) => (
                  <tr key={o.id} className="transition hover:bg-gray-50/80">
                    <td className="whitespace-nowrap px-4 py-4 text-gray-600 sm:px-6">
                      {o.created_at ? new Date(o.created_at).toLocaleString() : '—'}
                    </td>

                    <td className="px-4 py-4">
                      <Link
                        href={`/vendor/bookings/${o.id}`}
                        className="inline-flex items-center gap-1 font-mono text-xs font-medium text-blue-600 transition hover:text-blue-700"
                      >
                        <span className="truncate">{o.id}</span>
                        <ChevronRight size={14} />
                      </Link>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                          statusBadgeMap[o.status] ??
                          'bg-gray-100 text-gray-700 ring-1 ring-inset ring-gray-200'
                        }`}
                      >
                        {o.status.replaceAll('_', ' ')}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                          paymentBadgeMap[o.payment_status ?? 'unpaid']
                        }`}
                      >
                        {(o.payment_status ?? '—').replaceAll('_', ' ')}
                      </span>
                    </td>

                    <td className="px-4 py-4 font-medium text-gray-900">
                      {o.total_amount ? `₦${o.total_amount}` : '—'}
                    </td>

                    <td className="px-4 py-4 text-gray-600 sm:px-6">
                      <div className="flex items-start gap-2">
                        <MapPin size={15} className="mt-0.5 shrink-0 text-gray-400" />
                        <span className="line-clamp-2">{o.location ?? '—'}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-xs text-gray-400">Click Order ID to view booking details.</div>
    </div>
  )
}