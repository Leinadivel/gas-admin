'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

type VendorRow = {
  id: string
  business_name: string | null
  profile_id: string | null
  user_id: string | null
  wallet_balance: number | null
}

export default function VendorDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [vendor, setVendor] = useState<VendorRow | null>(null)

  const [driversCount, setDriversCount] = useState(0)
  const [vehiclesCount, setVehiclesCount] = useState(0)
  const [openOrdersCount, setOpenOrdersCount] = useState(0)

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

      // ✅ Vendors-only lookup that matches your real data
      const { data: vendorRow, error: vendorErr } = await supabase
        .from('vendors')
        .select('id,business_name,profile_id,user_id,wallet_balance')
        .or(`id.eq.${authId},user_id.eq.${authId},profile_id.eq.${authId}`)
        .maybeSingle()

      if (!mounted) return

      if (vendorErr) {
        setError(vendorErr.message)
        setLoading(false)
        return
      }

      if (!vendorRow) {
        setError('Vendor profile not found for this account.')
        setLoading(false)
        return
      }

      const v = vendorRow as VendorRow
      setVendor(v)

      // Counts (real tables)
      const [staffRes, vehiclesRes, ordersRes] = await Promise.all([
        supabase
          .from('vendor_staff')
          .select('id', { count: 'exact', head: true })
          .eq('vendor_id', v.id)
          .eq('is_active', true),

        supabase
          .from('vendor_vehicles')
          .select('id', { count: 'exact', head: true })
          .eq('vendor_id', v.id)
          .eq('is_active', true),

        supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('vendor_id', v.id)
          .in('status', ['pending', 'accepted', 'enroute', 'arrived', 'awaiting_payment']),
      ])

      if (!mounted) return

      if (staffRes.error) setError((prev) => prev ?? staffRes.error!.message)
      if (vehiclesRes.error) setError((prev) => prev ?? vehiclesRes.error!.message)
      if (ordersRes.error) setError((prev) => prev ?? ordersRes.error!.message)

      setDriversCount(staffRes.count ?? 0)
      setVehiclesCount(vehiclesRes.count ?? 0)
      setOpenOrdersCount(ordersRes.count ?? 0)

      setLoading(false)
    }

    load()
    return () => {
      mounted = false
    }
  }, [])

  const walletText = loading
    ? '…'
    : `₦${Number(vendor?.wallet_balance ?? 0).toLocaleString()}`

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">
            {vendor?.business_name ? vendor.business_name : 'Vendor Dashboard'}
          </h1>
          <p className="text-sm opacity-70">Overview</p>
        </div>

        <div className="text-xs opacity-60">{loading ? 'Loading…' : 'Ready'}</div>
      </div>

      {error ? (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Drivers" value={loading ? '…' : String(driversCount)} href="/vendor/drivers" />
        <StatCard label="Vehicles" value={loading ? '…' : String(vehiclesCount)} href="/vendor/vehicles" />
        <StatCard label="Open Orders" value={loading ? '…' : String(openOrdersCount)} href="/vendor/bookings" />
        <StatCard label="Wallet" value={walletText} href="/vendor/wallet" hint="Paystack coming next" />
      </div>

      <div className="rounded-xl border bg-white p-4">
        <div className="text-sm font-medium">Quick actions</div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50" href="/vendor/drivers/new">
            Add driver
          </Link>
          <Link className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50" href="/vendor/vehicles/new">
            Add vehicle
          </Link>
          <Link className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50" href="/vendor/documents">
            Upload documents
          </Link>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  href,
  hint,
}: {
  label: string
  value: string
  href: string
  hint?: string
}) {
  return (
    <Link href={href} className="block rounded-xl border bg-white p-4 hover:bg-gray-50 transition-colors">
      <div className="text-sm opacity-70">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      {hint ? <div className="mt-1 text-xs opacity-60">{hint}</div> : null}
    </Link>
  )
}
