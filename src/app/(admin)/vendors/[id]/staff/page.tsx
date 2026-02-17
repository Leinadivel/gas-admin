'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

type VendorStaff = {
  id: string
  vendor_id: string
  user_id: string
  role: 'driver' | 'manager' | 'owner'
  vehicle_id: string | null
  is_active: boolean
  created_at: string
}

type Vehicle = {
  id: string
  vendor_id: string
  label: string | null
  plate_number: string | null
  is_active: boolean
  is_online: boolean
  compliance_status: 'unsubmitted' | 'pending' | 'approved' | 'rejected'
  created_at?: string
}

type Profile = {
  id: string
  full_name?: string | null
  phone?: string | null
  email?: string | null
}

type InviteForm = {
  email: string
  full_name: string
  role: 'driver' | 'manager' | 'owner'
  vehicle_id: string | null
}

export default function VendorStaffPage() {
  const params = useParams<{ id: string }>()
  const vendorId = params.id
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [staff, setStaff] = useState<VendorStaff[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [profilesById, setProfilesById] = useState<Record<string, Profile>>({})

  // Invite modal state
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteOk, setInviteOk] = useState<string | null>(null)
  const [inviteForm, setInviteForm] = useState<InviteForm>({
    email: '',
    full_name: '',
    role: 'driver',
    vehicle_id: null,
  })

  async function load() {
    setLoading(true)
    setError(null)

    try {
      const { data: vehicleRows, error: vehiclesErr } = await supabase
        .from('vendor_vehicles')
        .select('id,vendor_id,label,plate_number,is_active,is_online,compliance_status,created_at')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: true })

      if (vehiclesErr) throw vehiclesErr
      setVehicles((vehicleRows ?? []) as Vehicle[])

      const { data: staffRows, error: staffErr } = await supabase
        .from('vendor_staff')
        .select('id,vendor_id,user_id,role,vehicle_id,is_active,created_at')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: true })

      if (staffErr) throw staffErr
      const staffList = (staffRows ?? []) as VendorStaff[]
      setStaff(staffList)

      const userIds = Array.from(new Set(staffList.map((s) => s.user_id)))
      if (userIds.length) {
        const { data: profileRows } = await supabase
          .from('profiles')
          .select('id,full_name,phone,email')
          .in('id', userIds)

        if (profileRows) {
          const map: Record<string, Profile> = {}
          for (const p of profileRows as Profile[]) map[p.id] = p
          setProfilesById(map)
        }
      }
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load staff')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!vendorId) return
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorId])

  async function setActive(staffId: string, nextActive: boolean) {
    setSavingId(staffId)
    setError(null)

    setStaff((prev) => prev.map((s) => (s.id === staffId ? { ...s, is_active: nextActive } : s)))

    const { error } = await supabase.from('vendor_staff').update({ is_active: nextActive }).eq('id', staffId)

    if (error) {
      setStaff((prev) => prev.map((s) => (s.id === staffId ? { ...s, is_active: !nextActive } : s)))
      setError(error.message)
    }

    setSavingId(null)
  }

  async function assignVehicle(staffId: string, vehicleIdOrNull: string | null) {
    setSavingId(staffId)
    setError(null)

    setStaff((prev) => prev.map((s) => (s.id === staffId ? { ...s, vehicle_id: vehicleIdOrNull } : s)))

    const { error } = await supabase.from('vendor_staff').update({ vehicle_id: vehicleIdOrNull }).eq('id', staffId)

    if (error) {
      await load()
      setError(error.message)
    }

    setSavingId(null)
  }

  const vehicleOptions = useMemo(() => {
    return vehicles.map((v) => {
      const name = v.label?.trim() ? v.label : 'Unnamed truck'
      const plate = v.plate_number ? ` • ${v.plate_number}` : ''
      const badge = `(${v.compliance_status}${v.is_active ? '' : ', inactive'})`
      return { id: v.id, label: `${name}${plate} ${badge}` }
    })
  }, [vehicles])

  function openInvite() {
    setInviteOk(null)
    setInviteError(null)
    setInviteForm({ email: '', full_name: '', role: 'driver', vehicle_id: null })
    setInviteOpen(true)
  }

  async function submitInvite() {
    setInviteLoading(true)
    setInviteError(null)
    setInviteOk(null)

    try {
      const email = inviteForm.email.trim().toLowerCase()
      if (!email) throw new Error('Email is required')

      const res = await fetch('/api/admin/invite-driver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor_id: vendorId,
          email,
          full_name: inviteForm.full_name.trim() || undefined,
          role: inviteForm.role,
          vehicle_id: inviteForm.vehicle_id,
        }),
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error ?? 'Invite failed')

      setInviteOk(`Invite sent to ${email}`)
      setInviteOpen(false)
      await load()
    } catch (e: any) {
      setInviteError(e?.message ?? 'Invite failed')
    } finally {
      setInviteLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Staff (Drivers)</h1>
          <p className="text-sm text-slate-600">
            Invite drivers, assign trucks, enable/disable access.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={openInvite}
            className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800"
          >
            Invite driver
          </button>

          <button
            onClick={() => router.push(`/vendors/${vendorId}`)}
            className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50"
          >
            Back to Vendor
          </button>
        </div>
      </div>

      {inviteOk ? (
        <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          {inviteOk}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-xl border p-6 text-sm text-slate-600">Loading staff…</div>
      ) : (
        <div className="rounded-2xl border bg-white">
          <div className="border-b px-4 py-3">
            <div className="text-sm font-medium">Staff list</div>
            <div className="text-xs text-slate-500">Assign a driver to an approved truck where possible.</div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-600">
                <tr>
                  <th className="px-4 py-3">Person</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Assigned Truck</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {staff.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-slate-600" colSpan={5}>
                      No staff yet.
                    </td>
                  </tr>
                ) : (
                  staff.map((s) => {
                    const p = profilesById[s.user_id]
                    const name = p?.full_name || '—'
                    const phone = p?.phone || ''
                    const email = p?.email || ''
                    const busy = savingId === s.id

                    return (
                      <tr key={s.id} className="border-t">
                        <td className="px-4 py-3">
                          <div className="font-medium">{name}</div>
                          <div className="text-xs text-slate-500">
                            <span className="font-mono">{s.user_id}</span>
                            {phone ? <span> • {phone}</span> : null}
                            {email ? <span> • {email}</span> : null}
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">{s.role}</span>
                        </td>

                        <td className="px-4 py-3">
                          <select
                            disabled={busy}
                            value={s.vehicle_id ?? ''}
                            onChange={(e) => assignVehicle(s.id, e.target.value ? e.target.value : null)}
                            className="w-full rounded-lg border px-2 py-2 text-sm"
                          >
                            <option value="">Unassigned</option>
                            {vehicleOptions.map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.label}
                              </option>
                            ))}
                          </select>
                          <div className="mt-1 text-xs text-slate-500">Drivers should be assigned to one truck.</div>
                        </td>

                        <td className="px-4 py-3">
                          {s.is_active ? (
                            <span className="rounded-full bg-green-50 px-2 py-1 text-xs text-green-700">Active</span>
                          ) : (
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">Disabled</span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-right">
                          {s.is_active ? (
                            <button
                              disabled={busy}
                              onClick={() => setActive(s.id, false)}
                              className="rounded-lg border px-3 py-2 text-xs hover:bg-slate-50 disabled:opacity-60"
                            >
                              Disable
                            </button>
                          ) : (
                            <button
                              disabled={busy}
                              onClick={() => setActive(s.id, true)}
                              className="rounded-lg border px-3 py-2 text-xs hover:bg-slate-50 disabled:opacity-60"
                            >
                              Enable
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t px-4 py-3 text-xs text-slate-500">
            Invite creates an auth user and links them to this vendor as staff.
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {inviteOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => !inviteLoading && setInviteOpen(false)} />
          <div className="relative w-full max-w-lg rounded-2xl border bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-base font-semibold">Invite driver</div>
                <div className="text-xs text-slate-500">Sends email invite + links driver to this vendor.</div>
              </div>
              <button
                className="rounded-lg border px-2 py-1 text-sm hover:bg-slate-50 disabled:opacity-60"
                disabled={inviteLoading}
                onClick={() => setInviteOpen(false)}
              >
                Close
              </button>
            </div>

            {inviteError ? (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                {inviteError}
              </div>
            ) : null}

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600">Email</label>
                <input
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="driver@24hrgas.com"
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600">Full name (optional)</label>
                <input
                  value={inviteForm.full_name}
                  onChange={(e) => setInviteForm((p) => ({ ...p, full_name: e.target.value }))}
                  placeholder="Driver name"
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-slate-600">Role</label>
                  <select
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm((p) => ({ ...p, role: e.target.value as InviteForm['role'] }))}
                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                  >
                    <option value="driver">Driver</option>
                    <option value="manager">Manager</option>
                    <option value="owner">Owner</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600">Assign truck (optional)</label>
                  <select
                    value={inviteForm.vehicle_id ?? ''}
                    onChange={(e) =>
                      setInviteForm((p) => ({ ...p, vehicle_id: e.target.value ? e.target.value : null }))
                    }
                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                  >
                    <option value="">Unassigned</option>
                    {vehicleOptions.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  disabled={inviteLoading}
                  onClick={() => setInviteOpen(false)}
                  className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  disabled={inviteLoading}
                  onClick={submitInvite}
                  className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  {inviteLoading ? 'Sending…' : 'Send invite'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
