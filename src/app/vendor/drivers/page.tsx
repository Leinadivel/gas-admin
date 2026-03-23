'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { Search, Plus, User, Truck, CheckCircle2, XCircle } from 'lucide-react'

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

      const hay = [s.id, s.full_name ?? '', s.role ?? '', vehiclePlate]
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
        .select(
          'id,vendor_id,user_id,full_name,role,vehicle_id,is_active,created_at'
        )
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
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'vendor_staff' },
        load
      )
      .subscribe()

    return () => {
      mounted = false
      supabase.removeChannel(ch)
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Drivers</h1>
          <p className="text-sm text-muted-foreground">
            {vendor?.business_name
              ? `${vendor.business_name} staff`
              : 'Manage your drivers and staff'}
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          {/* Search */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              className="w-full rounded-lg border bg-white pl-9 pr-3 py-2 text-sm shadow-sm outline-none transition focus:ring-2 focus:ring-blue-500"
              placeholder="Search drivers, role, plate..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          {/* CTA */}
          <Link
            href="/vendor/drivers/new"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add driver
          </Link>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Table Card */}
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-5 py-3 text-left">Created</th>
                <th className="px-5 py-3 text-left">Staff ID</th>
                <th className="px-5 py-3 text-left">Role</th>
                <th className="px-5 py-3 text-left">Driver</th>
                <th className="px-5 py-3 text-left">Vehicle</th>
                <th className="px-5 py-3 text-left">Status</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-gray-500">
                    Loading drivers...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-500">
                      <User className="h-6 w-6 opacity-60" />
                      <p className="text-sm">No drivers found</p>
                      <p className="text-xs opacity-60">
                        Try adjusting your search or add a new driver
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr
                    key={s.id}
                    className="border-t transition hover:bg-gray-50"
                  >
                    <td className="px-5 py-4 whitespace-nowrap text-gray-600">
                      {s.created_at
                        ? new Date(s.created_at).toLocaleString()
                        : '—'}
                    </td>

                    <td className="px-5 py-4 font-mono text-xs text-gray-500">
                      {s.id}
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium">
                        {s.role ?? '—'}
                      </span>
                    </td>

                    <td className="px-5 py-4 font-medium text-gray-800">
                      {s.full_name ?? '—'}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Truck className="h-4 w-4" />
                        {s.vehicle_id
                          ? vehicleMap[s.vehicle_id] ?? '—'
                          : '—'}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      {s.is_active ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-200 px-2 py-1 text-xs font-medium text-gray-600">
                          <XCircle className="h-3.5 w-3.5" />
                          Inactive
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer hint */}
      <div className="text-xs text-muted-foreground">
        Manage your drivers, assign vehicles, and monitor activity
      </div>
    </div>
  )
}