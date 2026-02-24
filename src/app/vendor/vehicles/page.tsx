'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

type VehicleRow = {
  id: string
  vendor_id: string
  label: string | null
  plate_number: string | null
  is_active: boolean
  is_online: boolean
  compliance_status: string | null
  created_at: string
  updated_at: string | null
}

type VendorRow = {
  id: string
  business_name: string | null
  profile_id?: string | null
  user_id?: string | null
  created_at?: string | null
}

export default function VendorVehiclesPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')

  const [vendor, setVendor] = useState<VendorRow | null>(null)
  const [vehicles, setVehicles] = useState<VehicleRow[]>([])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return vehicles
    return vehicles.filter((v) => {
      const hay = [v.id, v.label ?? '', v.plate_number ?? '', v.compliance_status ?? '']
        .join(' ')
        .toLowerCase()
      return hay.includes(query)
    })
  }, [vehicles, q])

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

      // ✅ SAFE vendor lookup (NO maybeSingle)
      const { data: vendorRows, error: vendorErr } = await supabase
        .from('vendors')
        .select('id,business_name,profile_id,user_id,created_at')
        .or(`profile_id.eq.${authId},user_id.eq.${authId},id.eq.${authId}`)
        .order('created_at', { ascending: false })

      if (!mounted) return

      if (vendorErr) {
        setError(vendorErr.message)
        setLoading(false)
        return
      }

      const rows = (vendorRows ?? []) as VendorRow[]
      const vendorRow =
        rows.find((r) => r.profile_id === authId) ??
        rows.find((r) => r.user_id === authId) ??
        rows[0] ??
        null

      if (!vendorRow) {
        setError('Vendor profile not found for this account.')
        setLoading(false)
        return
      }

      setVendor(vendorRow)

      // Load vehicles
      const { data: vehRows, error: vehiclesErr } = await supabase
        .from('vendor_vehicles')
        .select('id,vendor_id,label,plate_number,is_active,is_online,compliance_status,created_at,updated_at')
        .eq('vendor_id', vendorRow.id)
        .order('created_at', { ascending: false })
        .limit(200)

      if (!mounted) return

      if (vehiclesErr) {
        setError(vehiclesErr.message)
        setVehicles([])
      } else {
        setVehicles((vehRows ?? []) as VehicleRow[])
      }

      setLoading(false)
    }

    load()

    const ch = supabase
      .channel('vendor-vehicles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vendor_vehicles' }, load)
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
          <h1 className="text-2xl font-semibold">Vehicles</h1>
          <p className="text-sm opacity-70">
            {vendor?.business_name ? `${vendor.business_name} fleet` : 'Your vehicles'}
          </p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <input
            className="w-full sm:w-80 rounded-md border bg-white px-3 py-2 outline-none focus:ring-2"
            placeholder="Search: label, plate, compliance…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <div className="flex gap-2">
            <Link
              href="/vendor/assign"
              className="rounded-md border bg-white px-4 py-2 text-sm whitespace-nowrap hover:bg-gray-50"
            >
              Assign driver
            </Link>

            <Link
              href="/vendor/vehicles/new"
              className="rounded-md bg-black text-white px-4 py-2 text-sm whitespace-nowrap"
            >
              Add vehicle
            </Link>
          </div>
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
              <th className="px-4 py-3">Vehicle ID</th>
              <th className="px-4 py-3">Label</th>
              <th className="px-4 py-3">Plate</th>
              <th className="px-4 py-3">Online</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3">Compliance</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-6 opacity-70" colSpan={7}>
                  Loading…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td className="px-4 py-6 opacity-70" colSpan={7}>
                  No vehicles found.
                </td>
              </tr>
            ) : (
              filtered.map((v) => (
                <tr key={v.id} className="border-b last:border-b-0">
                  <td className="px-4 py-3 whitespace-nowrap">
                    {v.created_at ? new Date(v.created_at).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3 font-mono">{v.id}</td>
                  <td className="px-4 py-3">{v.label ?? '—'}</td>
                  <td className="px-4 py-3 font-mono">{v.plate_number ?? '—'}</td>
                  <td className="px-4 py-3">{v.is_online ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-3">{v.is_active ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-3">{v.compliance_status ?? '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="text-xs opacity-60">
        Next: build <code>/vendor/vehicles/new</code>, then Assign Driver → Vehicle.
      </div>
    </div>
  )
}