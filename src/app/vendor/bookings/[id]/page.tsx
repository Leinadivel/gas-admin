'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

type VendorRow = { id: string; business_name: string | null }

type OrderDetails = {
  id: string
  status: string
  created_at: string
  location: string | null
  latitude: number | null
  longitude: number | null
  cylinder_size: string | null
  quantity: number | null
  payment_status: string | null
  payment_method: string | null
  total_amount: number | null
  vendor_amount: number | null
  platform_amount: number | null
  delivery_fee: number | null
  paystack_reference: string | null
  paid_at: string | null
  vehicle_id: string | null
  distance_km: number | null
}

export default function VendorBookingDetailsPage() {
  const params = useParams()
  const orderId = String((params as any)?.id ?? '')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [vendor, setVendor] = useState<VendorRow | null>(null)
  const [order, setOrder] = useState<OrderDetails | null>(null)

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

      // vendor
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

      // order (must belong to vendor)
      const { data: orderRow, error: orderErr } = await supabase
        .from('orders')
        .select(
          [
            'id',
            'status',
            'created_at',
            'location',
            'latitude',
            'longitude',
            'cylinder_size',
            'quantity',
            'payment_status',
            'payment_method',
            'total_amount',
            'vendor_amount',
            'platform_amount',
            'delivery_fee',
            'paystack_reference',
            'paid_at',
            'vehicle_id',
            'distance_km',
          ].join(',')
        )
        .eq('id', orderId)
        .eq('vendor_id', v.id)
        .maybeSingle()

      if (!mounted) return

      if (orderErr) {
        setError(orderErr.message)
        setLoading(false)
        return
      }

      if (!orderRow) {
        setError('Booking not found (or not assigned to this vendor).')
        setLoading(false)
        return
      }

      setOrder(orderRow as OrderDetails)
      setLoading(false)
    }

    if (orderId) load()

    return () => {
      mounted = false
    }
  }, [orderId])

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Booking details</h1>
          <p className="text-sm opacity-70">
            {vendor?.business_name ?? 'Vendor'} • Order {orderId.slice(0, 8)}
          </p>
        </div>

        <Link
          href="/vendor/bookings"
          className="rounded-md border bg-white px-3 py-2 text-sm hover:bg-gray-50"
        >
          Back
        </Link>
      </div>

      {loading ? (
        <div className="rounded-xl border bg-white p-4 text-sm opacity-70">Loading…</div>
      ) : null}

      {error ? (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {order ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Status">
            <Row label="Status" value={order.status} />
            <Row label="Created" value={new Date(order.created_at).toLocaleString()} />
            <Row label="Payment status" value={order.payment_status ?? '—'} />
            <Row label="Payment method" value={order.payment_method ?? '—'} />
            <Row label="Paid at" value={order.paid_at ? new Date(order.paid_at).toLocaleString() : '—'} />
          </Card>

          <Card title="Customer location">
            <Row label="Address" value={order.location ?? '—'} />
            <Row label="Latitude" value={order.latitude ?? '—'} mono />
            <Row label="Longitude" value={order.longitude ?? '—'} mono />
            <Row label="Distance (km)" value={order.distance_km ?? '—'} />
          </Card>

          <Card title="Order">
            <Row label="Cylinder size" value={order.cylinder_size ?? '—'} />
            <Row label="Quantity" value={order.quantity ?? '—'} />
            <Row label="Vehicle" value={order.vehicle_id ?? '—'} mono />
          </Card>

          <Card title="Amounts">
            <Row label="Total" value={order.total_amount != null ? `₦${order.total_amount}` : '—'} />
            <Row label="Delivery fee" value={order.delivery_fee != null ? `₦${order.delivery_fee}` : '—'} />
            <Row label="Vendor amount" value={order.vendor_amount != null ? `₦${order.vendor_amount}` : '—'} />
            <Row label="Platform amount" value={order.platform_amount != null ? `₦${order.platform_amount}` : '—'} />
            <Row label="Paystack ref" value={order.paystack_reference ?? '—'} mono />
          </Card>
        </div>
      ) : null}

      <div className="text-xs opacity-60">
        Next: we’ll add a “Map view / open in Google Maps” button using lat/lng.
      </div>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="text-sm font-medium">{title}</div>
      <div className="mt-3 space-y-2">{children}</div>
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
    <div className="flex items-start justify-between gap-4 text-sm">
      <div className="opacity-70">{label}</div>
      <div className={mono ? 'font-mono text-xs text-right break-all' : 'text-right'}>
        {String(value)}
      </div>
    </div>
  )
}
