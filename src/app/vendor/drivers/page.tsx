'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { Search, Plus, Users } from 'lucide-react'

type StaffRow = {
  id: string
  vendor_id: string
  user_id: string | null
  full_name: string | null
  role: string | null
  vehicle_id: string | null
  is_active: boolean
  created_at: string
}

type VendorRow = {
  id: string
  business_name: string | null
  profile_id?: string | null
  user_id?: string | null
  created_at?: string | null
}

type VendorVehicleRow = {
  id: string
  plate_number: string | null
}

export default function VendorDriversPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')

  const [vendor, setVendor] = useState<VendorRow | null>(null)
  const [staff, setStaff] = useState<StaffRow[]>([])
  const [vehicleMap, setVehicleMap] = useState<Record<string, string>>({})

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return staff

    return staff.filter((s) => {
      const vehiclePlate = s.vehicle_id ? vehicleMap[s.vehicle_id] ?? '' : ''

      const hay = [
        s.id,
        s.full_name ?? '',
        s.role ?? '',
        vehiclePlate,
      ]
        .join(' ')
        .toLowerCase()

      return hay.includes(query)
    })
  }, [staff, q, vehicleMap])

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

      const { data: staffRows, error: staffErr } = await supabase
        .from('vendor_staff')
        .select('id,vendor_id,user_id,full_name,role,vehicle_id,is_active,created_at')
        .eq('vendor_id', vendorRow.id)
        .order('created_at', { ascending: false })
        .limit(200)

      if (!mounted) return

      if (staffErr) {
        setError(staffErr.message)
        setStaff([])
        setVehicleMap({})
        setLoading(false)
        return
      }

      const staffList = (staffRows ?? []) as StaffRow[]
      setStaff(staffList)

      const vehicleIds = Array.from(
        new Set(staffList.map((s) => s.vehicle_id).filter(Boolean) as string[])
      )

      if (vehicleIds.length > 0) {
        const { data: vehicleRows } = await supabase
          .from('vendor_vehicles')
          .select('id,plate_number')
          .in('id', vehicleIds)

        if (mounted) {
          const nextVehicleMap: Record<string, string> = {}
          ;((vehicleRows ?? []) as VendorVehicleRow[]).forEach((v) => {
            nextVehicleMap[v.id] = v.plate_number ?? '—'
          })
          setVehicleMap(nextVehicleMap)
        }
      } else if (mounted) {
        setVehicleMap({})
      }

      setLoading(false)
    }

    load()

    const ch = supabase
      .channel('vendor-staff')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vendor_staff' }, load)
      .subscribe()

    return () => {
      mounted = false
      supabase.removeChannel(ch)
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-blue-100 p-2 text-blue-600">
            <Users size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Drivers</h1>
            <p className="text-sm text-gray-500">
              {vendor?.business_name
                ? `${vendor.business_name} staff`
                : 'Manage your drivers and staff'}
            </p>
          </div>
        </div>

        <Link
          href="/vendor/drivers/new"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus size={16} />
          Add driver
        </Link>
      </div>

      {/* Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="Search drivers, roles, plates..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      {/* Error */}
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      {/* Table Card */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium">Staff ID</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Driver</th>
                <th className="px-4 py-3 font-medium">Vehicle</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                    Loading drivers...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-500">
                      <Users size={28} />
                      <p className="text-sm">No drivers found</p>
                      <p className="text-xs text-gray-400">
                        Try adjusting your search or add a new driver
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr
                    key={s.id}
                    className="transition hover:bg-gray-50"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                      {s.created_at
                        ? new Date(s.created_at).toLocaleString()
                        : '—'}
                    </td>

                    <td className="px-4 py-3 font-mono text-xs text-gray-500">
                      {s.id}
                    </td>

                    <td className="px-4 py-3">
                      <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                        {s.role ?? '—'}
                      </span>
                    </td>

                    <td className="px-4 py-3 font-medium text-gray-900">
                      {s.full_name ?? '—'}
                    </td>

                    <td className="px-4 py-3 text-gray-600">
                      {s.vehicle_id
                        ? vehicleMap[s.vehicle_id] ?? '—'
                        : '—'}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                          s.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {s.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer hint */}
      <div className="text-xs text-gray-400">
        Manage and assign drivers to vehicles from this page.
      </div>
    </div>
  )
}