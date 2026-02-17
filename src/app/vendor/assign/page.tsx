'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

type VendorRow = { id: string; business_name: string | null }

type StaffRow = {
  id: string
  user_id: string | null
  role: string | null
  vehicle_id: string | null
  is_active: boolean
}

type VehicleRow = {
  id: string
  label: string | null
  plate_number: string | null
  is_active: boolean
}

export default function VendorAssignPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [vendor, setVendor] = useState<VendorRow | null>(null)
  const [staff, setStaff] = useState<StaffRow[]>([])
  const [vehicles, setVehicles] = useState<VehicleRow[]>([])

  const [selectedStaffId, setSelectedStaffId] = useState<string>('')
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('')

  const staffSelected = useMemo(
    () => staff.find((s) => s.id === selectedStaffId) ?? null,
    [staff, selectedStaffId]
  )

  useEffect(() => {
    let mounted = true

    const load = async () => {
      setLoading(true)
      setError(null)
      setSuccess(null)

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

      // Vendor row
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
        setError('Vendor profile not found for this account.')
        setLoading(false)
        return
      }

      const v = vendorRow as VendorRow
      setVendor(v)

      // Load active staff + active vehicles
      const [staffRes, vehiclesRes] = await Promise.all([
        supabase
          .from('vendor_staff')
          .select('id,user_id,role,vehicle_id,is_active')
          .eq('vendor_id', v.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(200),

        supabase
          .from('vendor_vehicles')
          .select('id,label,plate_number,is_active')
          .eq('vendor_id', v.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(200),
      ])

      if (!mounted) return

      if (staffRes.error) setError((prev) => prev ?? staffRes.error!.message)
      if (vehiclesRes.error) setError((prev) => prev ?? vehiclesRes.error!.message)

      setStaff((staffRes.data ?? []) as StaffRow[])
      setVehicles((vehiclesRes.data ?? []) as VehicleRow[])

      setLoading(false)
    }

    load()
    return () => {
      mounted = false
    }
  }, [])

  const onAssign = async () => {
    setError(null)
    setSuccess(null)

    if (!selectedStaffId) {
      setError('Select a driver/staff first.')
      return
    }

    // vehicle can be empty to "unassign"
    setSaving(true)

    const { error } = await supabase
      .from('vendor_staff')
      .update({ vehicle_id: selectedVehicleId || null })
      .eq('id', selectedStaffId)

    setSaving(false)

    if (error) {
      setError(error.message)
      return
    }

    // Update local state for instant UI feedback
    setStaff((prev) =>
      prev.map((s) =>
        s.id === selectedStaffId ? { ...s, vehicle_id: selectedVehicleId || null } : s
      )
    )

    setSuccess('Assignment saved.')
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold">Assign driver</h1>
        <p className="text-sm opacity-70">
          Select a driver and choose a vehicle (or set to Unassigned).
        </p>
      </div>

      {error ? (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700">
          {success}
        </div>
      ) : null}

      <div className="rounded-xl border bg-white p-4 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Driver / Staff</label>
          <select
            className="w-full rounded-md border px-3 py-2 bg-white"
            value={selectedStaffId}
            onChange={(e) => {
              const id = e.target.value
              setSelectedStaffId(id)
              const s = staff.find((x) => x.id === id)
              setSelectedVehicleId(s?.vehicle_id ?? '')
              setSuccess(null)
              setError(null)
            }}
            disabled={loading}
          >
            <option value="">Select driver…</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.role ?? 'staff'} • {s.user_id ? s.user_id.slice(0, 8) : 'no-user'} • {s.id.slice(0, 8)}
              </option>
            ))}
          </select>
          <div className="text-xs opacity-60">
            Tip: we’ll later replace the user_id with driver name/phone when you add that.
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Vehicle</label>
          <select
            className="w-full rounded-md border px-3 py-2 bg-white"
            value={selectedVehicleId}
            onChange={(e) => {
              setSelectedVehicleId(e.target.value)
              setSuccess(null)
              setError(null)
            }}
            disabled={loading || !selectedStaffId}
          >
            <option value="">Unassigned</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {(v.label ?? 'Vehicle') +
                  (v.plate_number ? ` • ${v.plate_number}` : '') +
                  ` • ${v.id.slice(0, 8)}`}
              </option>
            ))}
          </select>
          {staffSelected ? (
            <div className="text-xs opacity-60">
              Current vehicle: {staffSelected.vehicle_id ? staffSelected.vehicle_id : 'Unassigned'}
            </div>
          ) : null}
        </div>

        <button
          onClick={onAssign}
          disabled={loading || saving || !selectedStaffId}
          className="rounded-md bg-black text-white px-4 py-2 text-sm disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save assignment'}
        </button>
      </div>

      <div className="text-xs opacity-60">
        This updates <code>vendor_staff.vehicle_id</code>.
      </div>
    </div>
  )
}
