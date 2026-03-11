'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

type StaffRow = {
  id: string
  vendor_id: string
  user_id: string | null
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

type ProfileRow = {
  id: string
  full_name: string | null
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
  const [profileMap, setProfileMap] = useState<Record<string, string>>({})
  const [vehicleMap, setVehicleMap] = useState<Record<string, string>>({})

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return staff

    return staff.filter((s) => {
      const driverName = s.user_id ? profileMap[s.user_id] ?? '' : ''
      const vehiclePlate = s.vehicle_id ? vehicleMap[s.vehicle_id] ?? '' : ''

      const hay = [
        s.id,
        driverName,
        s.role ?? '',
        vehiclePlate,
      ]
        .join(' ')
        .toLowerCase()

      return hay.includes(query)
    })
  }, [staff, q, profileMap, vehicleMap])

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
        .select('id,vendor_id,user_id,role,vehicle_id,is_active,created_at')
        .eq('vendor_id', vendorRow.id)
        .order('created_at', { ascending: false })
        .limit(200)

      if (!mounted) return

      if (staffErr) {
        setError(staffErr.message)
        setStaff([])
        setProfileMap({})
        setVehicleMap({})
        setLoading(false)
        return
      }

      const staffList = (staffRows ?? []) as StaffRow[]
      setStaff(staffList)

      const userIds = Array.from(
        new Set(staffList.map((s) => s.user_id).filter(Boolean) as string[])
      )

      const vehicleIds = Array.from(
        new Set(staffList.map((s) => s.vehicle_id).filter(Boolean) as string[])
      )

      if (userIds.length > 0) {
        const { data: profileRows } = await supabase
          .from('profiles')
          .select('id,full_name')
          .in('id', userIds)

        if (mounted) {
          const nextProfileMap: Record<string, string> = {}
          ;((profileRows ?? []) as ProfileRow[]).forEach((p) => {
            nextProfileMap[p.id] = p.full_name ?? '—'
          })
          setProfileMap(nextProfileMap)
        }
      } else if (mounted) {
        setProfileMap({})
      }

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
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Drivers</h1>
          <p className="text-sm opacity-70">
            {vendor?.business_name ? `${vendor.business_name} staff` : 'Your drivers and staff'}
          </p>
        </div>

        <div className="flex w-full gap-2 sm:w-auto">
          <input
            className="w-full rounded-md border bg-white px-3 py-2 outline-none focus:ring-2 sm:w-80"
            placeholder="Search: driver name, role, plate number…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <Link
            href="/vendor/drivers/new"
            className="whitespace-nowrap rounded-md bg-black px-4 py-2 text-sm text-white"
          >
            Add driver
          </Link>
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
              <th className="px-4 py-3">Staff ID</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Driver Name</th>
              <th className="px-4 py-3">Vehicle</th>
              <th className="px-4 py-3">Active</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-6 opacity-70" colSpan={6}>
                  Loading…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td className="px-4 py-6 opacity-70" colSpan={6}>
                  No drivers/staff found.
                </td>
              </tr>
            ) : (
              filtered.map((s) => (
                <tr key={s.id} className="border-b last:border-b-0">
                  <td className="whitespace-nowrap px-4 py-3">
                    {s.created_at ? new Date(s.created_at).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3 font-mono">{s.id}</td>
                  <td className="px-4 py-3">{s.role ?? '—'}</td>
                  <td className="px-4 py-3">
                    {s.user_id ? profileMap[s.user_id] ?? '—' : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {s.vehicle_id ? vehicleMap[s.vehicle_id] ?? '—' : '—'}
                  </td>
                  <td className="px-4 py-3">{s.is_active ? 'Yes' : 'No'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="text-xs opacity-60">
        Next: we’ll build <code>/vendor/drivers/new</code> to invite/create drivers and assign vehicles.
      </div>
    </div>
  )
}