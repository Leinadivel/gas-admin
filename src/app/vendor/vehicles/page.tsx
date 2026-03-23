'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { Car, Plus, Search, UserPlus } from 'lucide-react'

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

      const { data: vehRows, error: vehiclesErr } = await supabase
        .from('vendor_vehicles')
        .select(
          'id,vendor_id,label,plate_number,is_active,is_online,compliance_status,created_at,updated_at'
        )
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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-blue-100 p-3 text-blue-600">
            <Car size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Vehicles</h1>
            <p className="mt-1 text-sm text-gray-500">
              {vendor?.business_name ? `${vendor.business_name} fleet` : 'Manage your vehicles'}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/vendor/assign"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            <UserPlus size={16} />
            Assign driver
          </Link>

          <Link
            href="/vendor/vehicles/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={16} />
            Add vehicle
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="relative w-full sm:max-w-sm">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
            placeholder="Search by label, plate, or compliance..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Vehicle ID</th>
                <th className="px-4 py-3">Label</th>
                <th className="px-4 py-3">Plate</th>
                <th className="px-4 py-3">Online</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3">Compliance</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-500">
                    Loading vehicles...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12">
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="mb-3 rounded-full bg-gray-100 p-3 text-gray-400">
                        <Car size={22} />
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900">No vehicles found</h3>
                      <p className="mt-1 max-w-sm text-sm text-gray-500">
                        No vehicles match your current search. Add a new vehicle or try a
                        different keyword.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((v) => (
                  <tr key={v.id} className="transition hover:bg-gray-50/80">
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                      {v.created_at ? new Date(v.created_at).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{v.id}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{v.label ?? '—'}</td>
                    <td className="px-4 py-3 font-mono text-gray-700">{v.plate_number ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          v.is_online
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {v.is_online ? 'Online' : 'Offline'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          v.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {v.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700">
                        {v.compliance_status ?? '—'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-xs text-gray-400">
        Manage your fleet and assign drivers to each vehicle from this page.
      </div>
    </div>
  )
}