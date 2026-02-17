'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

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

export default function VendorDetailsPage() {
  const params = useParams<{ id: string }>()
  const vendorId = params?.id
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [vendor, setVendor] = useState<VendorRow | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!vendorId) return

    let mounted = true

    const load = async () => {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('vendors')
        .select(
          'id,profile_id,business_name,Vehicle_type,available,wallet_balance,balance,bank_name,account_number,account_name,last_lat,last_lng,last_seen_at,is_online,created_at'
        )
        .eq('id', vendorId)
        .maybeSingle()

      if (!mounted) return

      if (error) {
        setError(error.message)
        setVendor(null)
      } else {
        setVendor((data ?? null) as VendorRow | null)
      }

      setLoading(false)
    }

    load()

    const channel = supabase
      .channel(`admin-vendor-${vendorId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vendors',
          filter: `id=eq.${vendorId}`,
        },
        () => load()
      )
      .subscribe()

    return () => {
      mounted = false
      supabase.removeChannel(channel)
    }
  }, [vendorId])

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Vendor Details</h1>
          <p className="text-sm opacity-70 font-mono break-all">
            {vendorId ?? '—'}
          </p>
        </div>

        {/* Right-side buttons */}
        <div className="flex gap-2">
          <Link
            href={`/vendors/${vendorId}/staff`}
            className="rounded-md border bg-white px-3 py-2 text-sm hover:bg-gray-50"
          >
            Staff
          </Link>

          <Link
            href={`/vendors/${vendorId}/vehicles`}
            className="rounded-md border bg-white px-3 py-2 text-sm hover:bg-gray-50"
          >
            Vehicles
          </Link>

          <Link
            href={`/vendors/${vendorId}/compliance`}
            className="rounded-md border bg-white px-3 py-2 text-sm hover:bg-gray-50"
          >
            Compliance
          </Link>

          <Link
            href="/vendors"
            className="rounded-md border bg-white px-3 py-2 text-sm hover:bg-gray-50"
          >
            ← Back
          </Link>
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {!vendorId ? (
        <div className="rounded-xl border bg-white p-4 text-sm opacity-70">
          Loading route…
        </div>
      ) : loading ? (
        <div className="rounded-xl border bg-white p-4 text-sm opacity-70">
          Loading…
        </div>
      ) : !vendor ? (
        <div className="rounded-xl border bg-white p-4 text-sm opacity-70">
          Vendor not found (or blocked by RLS).
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border bg-white p-4">
            <div className="text-sm font-medium mb-3">Status</div>
            <Row label="Online" value={vendor.is_online ? 'Yes' : 'No'} />
            <Row label="Available" value={vendor.available ? 'Yes' : 'No'} />
            <Row label="Business" value={vendor.business_name ?? '—'} />
            <Row label="Vehicle type" value={vendor.Vehicle_type ?? '—'} />
            <Row
              label="Last seen"
              value={
                vendor.last_seen_at
                  ? new Date(vendor.last_seen_at).toLocaleString()
                  : '—'
              }
            />
          </div>

          <div className="rounded-xl border bg-white p-4">
            <div className="text-sm font-medium mb-3">Wallet</div>
            <Row label="Wallet balance" value={String(vendor.wallet_balance)} />
            <Row label="Balance" value={String(vendor.balance)} />
            <Row label="Bank" value={vendor.bank_name ?? '—'} />
            <Row label="Account name" value={vendor.account_name ?? '—'} />
            <Row label="Account number" value={vendor.account_number ?? '—'} mono />
          </div>

          <div className="rounded-xl border bg-white p-4 lg:col-span-2">
            <div className="text-sm font-medium mb-3">Identifiers</div>
            <Row label="Vendor ID" value={vendor.id} mono />
            <Row label="Profile ID" value={vendor.profile_id} mono />
            <Row
              label="Created"
              value={new Date(vendor.created_at).toLocaleString()}
            />
            <Row
              label="Last location"
              value={
                vendor.last_lat != null && vendor.last_lng != null
                  ? `${vendor.last_lat}, ${vendor.last_lng}`
                  : '—'
              }
              mono
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
