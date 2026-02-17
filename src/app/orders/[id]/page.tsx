'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
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

export default function OrderDetailsPage() {
  const params = useParams<{ id: string }>()
  const orderId = params?.id

  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<OrderRow | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!orderId) return

    let mounted = true

    const load = async () => {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('orders')
        .select(
          'id,status,user_id,vendor_id,location,cylinder_size,quantity,created_at'
        )
        .eq('id', orderId)
        .maybeSingle()

      if (!mounted) return

      if (error) {
        setError(error.message)
        setOrder(null)
      } else {
        setOrder((data ?? null) as OrderRow | null)
      }

      setLoading(false)
    }

    load()

    const channel = supabase
      .channel(`admin-order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        () => load()
      )
      .subscribe()

    return () => {
      mounted = false
      supabase.removeChannel(channel)
    }
  }, [orderId])

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Order Details</h1>
          <p className="text-sm opacity-70 font-mono break-all">
            {orderId ?? '—'}
          </p>
        </div>

        <Link
          href="/orders"
          className="rounded-md border bg-white px-3 py-2 text-sm hover:bg-gray-50"
        >
          ← Back to Orders
        </Link>
      </div>

      {error ? (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {!orderId ? (
        <div className="rounded-xl border bg-white p-4 text-sm opacity-70">
          Loading route…
        </div>
      ) : loading ? (
        <div className="rounded-xl border bg-white p-4 text-sm opacity-70">
          Loading…
        </div>
      ) : !order ? (
        <div className="rounded-xl border bg-white p-4 text-sm opacity-70">
          Order not found (or blocked by RLS).
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border bg-white p-4">
            <div className="text-sm font-medium mb-3">Summary</div>
            <Row label="Status" value={order.status} />
            <Row label="Cylinder" value={order.cylinder_size ?? '—'} />
            <Row label="Quantity" value={order.quantity ?? '—'} />
            <Row label="Location" value={order.location ?? '—'} />
          </div>

          <div className="rounded-xl border bg-white p-4">
            <div className="text-sm font-medium mb-3">Links</div>
            <Row label="User ID" value={order.user_id ?? '—'} mono />
            <Row label="Vendor ID" value={order.vendor_id ?? '—'} mono />
            <Row
              label="Created"
              value={
                order.created_at
                  ? new Date(order.created_at).toLocaleString()
                  : '—'
              }
            />
          </div>
        </div>
      )}
    </div>
  )
}

function Row({
  label,
  value,
  mono,
}: {
  label: string
  value: any
  mono?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b last:border-b-0">
      <div className="text-sm opacity-70">{label}</div>
      <div
        className={[
          'text-sm text-right break-words',
          mono ? 'font-mono' : '',
        ].join(' ')}
      >
        {String(value)}
      </div>
    </div>
  )
}
