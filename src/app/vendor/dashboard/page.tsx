'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import {
  Users,
  Truck,
  ClipboardList,
  Wallet,
  ArrowRight,
  Plus,
  FileText,
  Flame,
  Activity,
} from 'lucide-react'

type VendorRow = {
  id: string
  business_name: string | null
  profile_id: string | null
  user_id: string | null
  wallet_balance: number | null
  created_at?: string | null
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

      const { data: vendorRows, error: vendorErr } = await supabase
        .from('vendors')
        .select('id,business_name,profile_id,user_id,wallet_balance,created_at')
        .or(`profile_id.eq.${authId},user_id.eq.${authId},id.eq.${authId}`)
        .order('created_at', { ascending: false })

      if (!mounted) return

      if (vendorErr) {
        setError(vendorErr.message)
        setLoading(false)
        return
      }

      const rows = (vendorRows ?? []) as VendorRow[]

      if (!rows.length) {
        setError('Vendor profile not found for this account.')
        setLoading(false)
        return
      }

      const vendorRow =
        rows.find((r) => r.profile_id === authId) ??
        rows.find((r) => r.user_id === authId) ??
        rows[0]

      setVendor(vendorRow)

      const [staffRes, vehiclesRes, ordersRes] = await Promise.all([
        supabase
          .from('vendor_staff')
          .select('id', { count: 'exact', head: true })
          .eq('vendor_id', vendorRow.id)
          .eq('is_active', true),

        supabase
          .from('vendor_vehicles')
          .select('id', { count: 'exact', head: true })
          .eq('vendor_id', vendorRow.id)
          .eq('is_active', true),

        supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('vendor_id', vendorRow.id)
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

  const walletText = useMemo(() => {
    if (loading) return '…'
    return `₦${Number(vendor?.wallet_balance ?? 0).toLocaleString()}`
  }, [loading, vendor?.wallet_balance])

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-600 via-blue-600 to-orange-500 text-white shadow-sm">
        <div className="flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white/95">
              <Flame className="h-4 w-4" />
              24hrsGas Vendor Portal
            </div>

            <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
              {vendor?.business_name ?? 'Vendor Dashboard'}
            </h1>

            <p className="mt-2 max-w-xl text-sm text-white/85 sm:text-base">
              Track drivers, manage vehicles, monitor bookings, and keep your operations moving from one clean dashboard.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:min-w-[260px]">
            <HeroMiniCard
              label="Status"
              value={loading ? 'Loading' : 'Ready'}
              icon={<Activity className="h-4 w-4" />}
            />
            <HeroMiniCard
              label="Wallet"
              value={walletText}
              icon={<Wallet className="h-4 w-4" />}
            />
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active Drivers"
          value={loading ? '…' : String(driversCount)}
          href="/vendor/drivers"
          icon={<Users className="h-5 w-5" />}
          tone="blue"
        />
        <StatCard
          label="Active Vehicles"
          value={loading ? '…' : String(vehiclesCount)}
          href="/vendor/vehicles"
          icon={<Truck className="h-5 w-5" />}
          tone="orange"
        />
        <StatCard
          label="Open Orders"
          value={loading ? '…' : String(openOrdersCount)}
          href="/vendor/bookings"
          icon={<ClipboardList className="h-5 w-5" />}
          tone="blue"
        />
        <StatCard
          label="Wallet Balance"
          value={walletText}
          href="/vendor/wallet"
          hint="Paystack coming next"
          icon={<Wallet className="h-5 w-5" />}
          tone="orange"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Quick actions</h2>
              <p className="mt-1 text-sm text-gray-500">
                Jump straight into the most important tasks for your team.
              </p>
            </div>

            <div className="hidden rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 sm:block">
              Fast access
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <ActionCard
              href="/vendor/drivers/new"
              title="Add driver"
              desc="Invite a new driver and get them set up quickly."
              icon={<Plus className="h-5 w-5" />}
              tone="blue"
            />
            <ActionCard
              href="/vendor/vehicles/new"
              title="Add vehicle"
              desc="Register a new vehicle and keep fleet records updated."
              icon={<Truck className="h-5 w-5" />}
              tone="orange"
            />
            <ActionCard
              href="/vendor/documents"
              title="Upload documents"
              desc="Keep compliance and company files organized in one place."
              icon={<FileText className="h-5 w-5" />}
              tone="blue"
            />
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">Operations snapshot</h2>
          <p className="mt-1 text-sm text-gray-500">
            A quick view of where your business stands right now.
          </p>

          <div className="mt-5 space-y-4">
            <SnapshotRow
              label="Drivers ready"
              value={loading ? '…' : `${driversCount}`}
              tone="blue"
            />
            <SnapshotRow
              label="Vehicles available"
              value={loading ? '…' : `${vehiclesCount}`}
              tone="orange"
            />
            <SnapshotRow
              label="Orders in progress"
              value={loading ? '…' : `${openOrdersCount}`}
              tone="blue"
            />
            <SnapshotRow
              label="Current wallet"
              value={walletText}
              tone="orange"
            />
          </div>

          <div className="mt-6 rounded-2xl border border-orange-100 bg-orange-50 p-4">
            <div className="text-sm font-semibold text-orange-800">
              Keep your operations healthy
            </div>
            <p className="mt-1 text-sm text-orange-700">
              Make sure drivers are active, vehicles are assigned, and documents are up to date for smoother bookings.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

function HeroMiniCard({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-xs font-semibold text-white/80">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-lg font-bold text-white">{value}</div>
    </div>
  )
}

function StatCard({
  label,
  value,
  href,
  hint,
  icon,
  tone,
}: {
  label: string
  value: string
  href: string
  hint?: string
  icon: React.ReactNode
  tone: 'blue' | 'orange'
}) {
  const toneClasses =
    tone === 'orange'
      ? {
          wrap: 'border-orange-100 hover:border-orange-200 hover:bg-orange-50/40',
          icon: 'bg-orange-100 text-orange-700',
          value: 'text-orange-600',
        }
      : {
          wrap: 'border-blue-100 hover:border-blue-200 hover:bg-blue-50/40',
          icon: 'bg-blue-100 text-blue-700',
          value: 'text-blue-600',
        }

  return (
    <Link
      href={href}
      className={`group block rounded-3xl border bg-white p-5 shadow-sm transition-all ${toneClasses.wrap}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-gray-500">{label}</div>
          <div className={`mt-3 text-3xl font-bold tracking-tight ${toneClasses.value}`}>
            {value}
          </div>
          {hint ? <div className="mt-2 text-xs text-gray-500">{hint}</div> : null}
        </div>

        <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${toneClasses.icon}`}>
          {icon}
        </div>
      </div>

      <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-gray-700">
        View details
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  )
}

function ActionCard({
  href,
  title,
  desc,
  icon,
  tone,
}: {
  href: string
  title: string
  desc: string
  icon: React.ReactNode
  tone: 'blue' | 'orange'
}) {
  const toneClasses =
    tone === 'orange'
      ? 'border-orange-100 bg-orange-50/50 hover:bg-orange-50'
      : 'border-blue-100 bg-blue-50/50 hover:bg-blue-50'

  const iconClasses =
    tone === 'orange' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'

  return (
    <Link
      href={href}
      className={`group rounded-2xl border p-4 transition-all ${toneClasses}`}
    >
      <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${iconClasses}`}>
        {icon}
      </div>

      <div className="mt-4 text-sm font-semibold text-gray-900">{title}</div>
      <p className="mt-1 text-sm leading-6 text-gray-600">{desc}</p>

      <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-gray-700">
        Open
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  )
}

function SnapshotRow({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: 'blue' | 'orange'
}) {
  const dot = tone === 'orange' ? 'bg-orange-500' : 'bg-blue-600'

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
      <div className="flex items-center gap-3">
        <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </div>
      <span className="text-sm font-semibold text-gray-900">{value}</span>
    </div>
  )
}