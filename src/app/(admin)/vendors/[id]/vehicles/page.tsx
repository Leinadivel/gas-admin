'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

type Vehicle = {
  id: string
  vendor_id: string
  label: string | null
  plate_number: string | null
  is_active: boolean
  is_online: boolean
  is_suspended: boolean
  compliance_status: 'unsubmitted' | 'pending' | 'approved' | 'rejected'
  created_at: string
}

type CreateVehicleForm = {
  label: string
  plate_number: string
}

export default function VendorVehiclesPage() {
  const params = useParams<{ id: string }>()
  const vendorId = params.id
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)

  const [vehicles, setVehicles] = useState<Vehicle[]>([])

  // Create modal
  const [createOpen, setCreateOpen] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createForm, setCreateForm] = useState<CreateVehicleForm>({ label: '', plate_number: '' })

  async function load() {
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('vendor_vehicles')
        .select(
          'id,vendor_id,label,plate_number,is_active,is_online,is_suspended,compliance_status,created_at'
        )
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setVehicles((data ?? []) as Vehicle[])
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load vehicles')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!vendorId) return
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorId])

  const stats = useMemo(() => {
    const total = vehicles.length
    const online = vehicles.filter((v) => v.is_online).length
    const approved = vehicles.filter((v) => v.compliance_status === 'approved').length
    const suspended = vehicles.filter((v) => v.is_suspended).length
    return { total, online, approved, suspended }
  }, [vehicles])

  function openCreate() {
    setCreateError(null)
    setCreateForm({ label: '', plate_number: '' })
    setCreateOpen(true)
  }

  async function createVehicle() {
    setCreateLoading(true)
    setCreateError(null)

    try {
      const label = createForm.label.trim()
      const plate = createForm.plate_number.trim() || null

      if (!label) throw new Error('Truck label is required')

      const { error } = await supabase.from('vendor_vehicles').insert({
        vendor_id: vendorId,
        label,
        plate_number: plate,
        is_active: true,
        is_online: false,
        is_suspended: false,
        compliance_status: 'unsubmitted',
      })

      if (error) throw error

      setCreateOpen(false)
      await load()
    } catch (e: any) {
      setCreateError(e?.message ?? 'Failed to create vehicle')
    } finally {
      setCreateLoading(false)
    }
  }

  async function toggleSuspend(vehicleId: string, nextSuspended: boolean) {
    setSavingId(vehicleId)
    setError(null)

    // optimistic
    setVehicles((prev) =>
      prev.map((v) => (v.id === vehicleId ? { ...v, is_suspended: nextSuspended } : v))
    )

    const payload: any = {
      is_suspended: nextSuspended,
      suspended_at: nextSuspended ? new Date().toISOString() : null,
      suspension_reason: nextSuspended ? 'Suspended by admin' : null,
    }

    const { error } = await supabase.from('vendor_vehicles').update(payload).eq('id', vehicleId)

    if (error) {
      // rollback
      setVehicles((prev) =>
        prev.map((v) => (v.id === vehicleId ? { ...v, is_suspended: !nextSuspended } : v))
      )
      setError(error.message)
    }

    setSavingId(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Vehicles (Trucks)</h1>
          <p className="text-sm text-slate-600">
            Manage trucks for this vendor: create trucks and suspend/unsuspend them.
          </p>

          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-slate-100 px-2 py-1">Total: {stats.total}</span>
            <span className="rounded-full bg-slate-100 px-2 py-1">Online: {stats.online}</span>
            <span className="rounded-full bg-slate-100 px-2 py-1">Approved: {stats.approved}</span>
            <span className="rounded-full bg-slate-100 px-2 py-1">Suspended: {stats.suspended}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={openCreate}
            className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800"
          >
            Add truck
          </button>
          <button
            onClick={() => router.push(`/vendors/${vendorId}`)}
            className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50"
          >
            Back to Vendor
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
      ) : null}

      {loading ? (
        <div className="rounded-xl border p-6 text-sm text-slate-600">Loading vehicles…</div>
      ) : (
        <div className="rounded-2xl border bg-white">
          <div className="border-b px-4 py-3">
            <div className="text-sm font-medium">Truck list</div>
            <div className="text-xs text-slate-500">
              Online availability is enforced by compliance + suspension rules (DB-side).
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-600">
                <tr>
                  <th className="px-4 py-3">Truck</th>
                  <th className="px-4 py-3">Plate</th>
                  <th className="px-4 py-3">Compliance</th>
                  <th className="px-4 py-3">Online</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {vehicles.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-slate-600" colSpan={6}>
                      No trucks yet.
                    </td>
                  </tr>
                ) : (
                  vehicles.map((v) => {
                    const busy = savingId === v.id
                    return (
                      <tr key={v.id} className="border-t">
                        <td className="px-4 py-3">
                          <div className="font-medium">{v.label || 'Unnamed truck'}</div>
                          <div className="text-xs text-slate-500 font-mono">{v.id}</div>
                        </td>

                        <td className="px-4 py-3">{v.plate_number || '—'}</td>

                        <td className="px-4 py-3">
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">
                            {v.compliance_status}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          {v.is_online ? (
                            <span className="rounded-full bg-green-50 px-2 py-1 text-xs text-green-700">
                              Online
                            </span>
                          ) : (
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                              Offline
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          {v.is_suspended ? (
                            <span className="rounded-full bg-red-50 px-2 py-1 text-xs text-red-700">
                              Suspended
                            </span>
                          ) : (
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                              Active
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-right">
                          {v.is_suspended ? (
                            <button
                              disabled={busy}
                              onClick={() => toggleSuspend(v.id, false)}
                              className="rounded-lg border px-3 py-2 text-xs hover:bg-slate-50 disabled:opacity-60"
                            >
                              Unsuspend
                            </button>
                          ) : (
                            <button
                              disabled={busy}
                              onClick={() => toggleSuspend(v.id, true)}
                              className="rounded-lg border px-3 py-2 text-xs hover:bg-slate-50 disabled:opacity-60"
                            >
                              Suspend
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
            Next: we’ll add “Approve/Reject compliance” with document review.
          </div>
        </div>
      )}

      {/* Create Modal */}
      {createOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => !createLoading && setCreateOpen(false)} />
          <div className="relative w-full max-w-lg rounded-2xl border bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-base font-semibold">Add truck</div>
                <div className="text-xs text-slate-500">Create a new vehicle for this vendor.</div>
              </div>
              <button
                className="rounded-lg border px-2 py-1 text-sm hover:bg-slate-50 disabled:opacity-60"
                disabled={createLoading}
                onClick={() => setCreateOpen(false)}
              >
                Close
              </button>
            </div>

            {createError ? (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                {createError}
              </div>
            ) : null}

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600">Truck label</label>
                <input
                  value={createForm.label}
                  onChange={(e) => setCreateForm((p) => ({ ...p, label: e.target.value }))}
                  placeholder="e.g. Ikeja Truck"
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600">Plate number (optional)</label>
                <input
                  value={createForm.plate_number}
                  onChange={(e) => setCreateForm((p) => ({ ...p, plate_number: e.target.value }))}
                  placeholder="e.g. ABC-123XY"
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  disabled={createLoading}
                  onClick={() => setCreateOpen(false)}
                  className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  disabled={createLoading}
                  onClick={createVehicle}
                  className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  {createLoading ? 'Creating…' : 'Create truck'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
