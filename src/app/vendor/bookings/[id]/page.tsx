'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import {
  ArrowLeft,
  CreditCard,
  MapPin,
  Truck,
  User,
  Wallet,
} from 'lucide-react'

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
  driver_staff_id: string | null
  distance_km: number | null
}

export default function VendorBookingDetailsPage() {
  const params = useParams()
  const orderId = String((params as any)?.id ?? '')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [vendor, setVendor] = useState<VendorRow | null>(null)
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [vehiclePlate, setVehiclePlate] = useState<string | null>(null)
  const [driverName, setDriverName] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const load = async () => {
      setLoading(true)
      setError(null)
      setOrder(null)
      setVehiclePlate(null)
      setDriverName(null)

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

      const v: VendorRow = {
        id: String((vendorRow as any).id),
        business_name: (vendorRow as any).business_name ?? null,
      }
      setVendor(v)

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
            'driver_staff_id',
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

      const o: OrderDetails = {
        id: String((orderRow as any).id),
        status: String((orderRow as any).status),
        created_at: String((orderRow as any).created_at),
        location: (orderRow as any).location ?? null,
        latitude: (orderRow as any).latitude ?? null,
        longitude: (orderRow as any).longitude ?? null,
        cylinder_size: (orderRow as any).cylinder_size ?? null,
        quantity: (orderRow as any).quantity ?? null,
        payment_status: (orderRow as any).payment_status ?? null,
        payment_method: (orderRow as any).payment_method ?? null,
        total_amount: (orderRow as any).total_amount ?? null,
        vendor_amount: (orderRow as any).vendor_amount ?? null,
        platform_amount: (orderRow as any).platform_amount ?? null,
        delivery_fee: (orderRow as any).delivery_fee ?? null,
        paystack_reference: (orderRow as any).paystack_reference ?? null,
        paid_at: (orderRow as any).paid_at ?? null,
        vehicle_id: (orderRow as any).vehicle_id ?? null,
        driver_staff_id: (orderRow as any).driver_staff_id ?? null,
        distance_km: (orderRow as any).distance_km ?? null,
      }

      setOrder(o)

      if (o.vehicle_id) {
        const { data: vehicleRow } = await supabase
          .from('vendor_vehicles')
          .select('plate_number')
          .eq('id', o.vehicle_id)
          .maybeSingle()

        if (vehicleRow?.plate_number) {
          setVehiclePlate(vehicleRow.plate_number)
        }
      }

      if (o.driver_staff_id) {
        const { data: driverRows, error: driverErr } = await supabase.rpc(
          'get_vendor_order_driver_details',
          { p_order_id: o.id }
        )

        if (!driverErr) {
          const row = Array.isArray(driverRows) ? driverRows[0] : null
          if (row?.driver_full_name) {
            setDriverName(row.driver_full_name)
          }
        }
      }

      setLoading(false)
    }

    if (orderId) load()

    return () => {
      mounted = false
    }
  }, [orderId])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-blue-100 p-3 text-blue-600">
            <Truck size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              Booking details
            </h1>
            <p className="text-sm text-gray-500">
              {vendor?.business_name ?? 'Vendor'} • Order{' '}
              {orderId ? orderId.slice(0, 8) : '—'}
            </p>
          </div>
        </div>

        <Link
          href="/vendor/bookings"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 transition hover:border-blue-200 hover:text-blue-600"
        >
          <ArrowLeft size={16} />
          Back
        </Link>
      </div>

      {/* States */}
      {loading && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
          Loading booking details...
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Content */}
      {order && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Status" icon={<Truck size={16} />}>
            <Row label="Status" value={order.status} />
            <Row label="Created" value={new Date(order.created_at).toLocaleString()} />
            <Row label="Payment status" value={order.payment_status ?? '—'} />
            <Row label="Payment method" value={order.payment_method ?? '—'} />
            <Row
              label="Paid at"
              value={order.paid_at ? new Date(order.paid_at).toLocaleString() : '—'}
            />
          </Card>

          <Card title="Customer location" icon={<MapPin size={16} />}>
            <Row label="Address" value={order.location ?? '—'} />
            <Row label="Latitude" value={order.latitude ?? '—'} mono />
            <Row label="Longitude" value={order.longitude ?? '—'} mono />
            <Row label="Distance (km)" value={order.distance_km ?? '—'} />
          </Card>

          <Card title="Order details" icon={<User size={16} />}>
            <Row label="Cylinder size" value={order.cylinder_size ?? '—'} />
            <Row label="Quantity" value={order.quantity ?? '—'} />
            <Row label="Vehicle" value={vehiclePlate ?? '—'} mono />
            <Row label="Driver" value={driverName ?? '—'} />
          </Card>

          <Card title="Payment breakdown" icon={<CreditCard size={16} />}>
            <Row
              label="Total"
              value={order.total_amount != null ? `₦${order.total_amount}` : '—'}
            />
            <Row
              label="Delivery fee"
              value={order.delivery_fee != null ? `₦${order.delivery_fee}` : '—'}
            />
            <Row
              label="Vendor amount"
              value={order.vendor_amount != null ? `₦${order.vendor_amount}` : '—'}
            />
            <Row
              label="Platform amount"
              value={order.platform_amount != null ? `₦${order.platform_amount}` : '—'}
            />
            <Row label="Reference" value={order.paystack_reference ?? '—'} mono />
          </Card>
        </div>
      )}

      <div className="text-xs text-gray-400">
        Next: Map integration and live tracking UI.
      </div>
    </div>
  )
}

function Card({
  title,
  icon,
  children,
}: {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
        {icon}
        {title}
      </div>
      <div className="mt-4 space-y-3">{children}</div>
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
      <div className="text-gray-500">{label}</div>
      <div
        className={`text-right text-gray-900 ${
          mono ? 'font-mono text-xs break-all' : ''
        }`}
      >
        {String(value)}
      </div>
    </div>
  )
}