'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { ArrowRightLeft, Car, CheckCircle2, UserCheck, Users } from 'lucide-react'

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

  const currentVehicle = useMemo(
    () => vehicles.find((v) => v.id === staffSelected?.vehicle_id) ?? null,
    [vehicles, staffSelected]
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

    setStaff((prev) =>
      prev.map((s) =>
        s.id === selectedStaffId ? { ...s, vehicle_id: selectedVehicleId || null } : s
      )
    )

    setSuccess('Assignment saved.')
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-blue-100 p-3 text-blue-600">
          <ArrowRightLeft size={22} />
        </div>

        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
            Assign driver
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {vendor?.business_name
              ? `Assign active drivers and vehicles for ${vendor.business_name}.`
              : 'Select a driver and choose a vehicle to assign or leave them unassigned.'}
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-gray-900">Assignment details</h2>
            <p className="mt-1 text-sm text-gray-500">
              Choose a driver first, then assign a vehicle from your active fleet.
            </p>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Driver / Staff</label>
              <div className="relative">
                <Users
                  size={18}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <select
                  className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-gray-50"
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
                      {s.role ?? 'staff'} • {s.user_id ? s.user_id.slice(0, 8) : 'no-user'} •{' '}
                      {s.id.slice(0, 8)}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-gray-400">
                Pick the staff member you want to assign.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Vehicle</label>
              <div className="relative">
                <Car
                  size={18}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <select
                  className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-gray-50"
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
              </div>
              {staffSelected ? (
                <p className="text-xs text-gray-400">
                  Current vehicle:{' '}
                  {currentVehicle
                    ? `${currentVehicle.label ?? 'Vehicle'}${
                        currentVehicle.plate_number ? ` • ${currentVehicle.plate_number}` : ''
                      }`
                    : staffSelected.vehicle_id
                    ? staffSelected.vehicle_id
                    : 'Unassigned'}
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 border-t border-gray-100 pt-5 sm:flex-row">
            <button
              onClick={onAssign}
              disabled={loading || saving || !selectedStaffId}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CheckCircle2 size={16} />
              {saving ? 'Saving…' : 'Save assignment'}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <div className="rounded-xl bg-blue-100 p-2 text-blue-600">
                <UserCheck size={18} />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Assignment overview</h3>
            </div>

            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-center justify-between rounded-xl border border-white/80 bg-white/80 p-3">
                <span>Active staff</span>
                <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                  {loading ? '...' : staff.length}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-white/80 bg-white/80 p-3">
                <span>Active vehicles</span>
                <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-700">
                  {loading ? '...' : vehicles.length}
                </span>
              </div>

              <div className="rounded-xl border border-white/80 bg-white/80 p-3">
                Leave the vehicle field as <span className="font-medium text-gray-900">Unassigned</span>{' '}
                if the selected staff member should not be attached to any vehicle yet.
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-orange-100 bg-orange-50 p-5">
            <h3 className="text-sm font-semibold text-gray-900">Helpful note</h3>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Assignments update the selected staff member instantly, so your dispatch and fleet
              views stay organized.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}