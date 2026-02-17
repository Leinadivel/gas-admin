'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

type Requirement = {
  id: string
  scope: 'business' | 'vehicle'
  doc_type: string
  is_required: boolean
  is_active: boolean
}

type Vehicle = {
  id: string
  vendor_id: string
  label: string | null
  plate_number: string | null
  is_suspended: boolean
  is_online: boolean
  compliance_status: 'unsubmitted' | 'pending' | 'approved' | 'rejected'
  created_at: string
}

type VehicleDoc = {
  id: string
  vehicle_id: string
  doc_type: string
  file_path: string
  status: 'pending' | 'approved' | 'rejected'
  submitted_at: string
  reviewed_at: string | null
  reviewed_by: string | null
  rejection_reason: string | null
  expires_at: string | null
}

type Row = {
  doc_type: string
  required: boolean
  latest: VehicleDoc | null
}

export default function VendorVehicleCompliancePage() {
  const params = useParams<{ id: string }>()
  const vendorId = params.id

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [reqs, setReqs] = useState<Requirement[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [docs, setDocs] = useState<VehicleDoc[]>([])
  const [openVehicleId, setOpenVehicleId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)

    try {
      const { data: reqRows, error: rErr } = await supabase
        .from('compliance_requirements')
        .select('id,scope,doc_type,is_required,is_active')
        .eq('scope', 'vehicle')
        .eq('is_active', true)
        .order('doc_type', { ascending: true })

      if (rErr) throw rErr
      setReqs((reqRows ?? []) as Requirement[])

      const { data: vehicleRows, error: vErr } = await supabase
        .from('vendor_vehicles')
        .select('id,vendor_id,label,plate_number,is_suspended,is_online,compliance_status,created_at')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: true })

      if (vErr) throw vErr
      const vList = (vehicleRows ?? []) as Vehicle[]
      setVehicles(vList)

      if (vList.length === 0) {
        setDocs([])
        return
      }

      const vehicleIds = vList.map((v) => v.id)

      const { data: docRows, error: dErr } = await supabase
        .from('vendor_vehicle_documents')
        .select(
          'id,vehicle_id,doc_type,file_path,status,submitted_at,reviewed_at,reviewed_by,rejection_reason,expires_at'
        )
        .in('vehicle_id', vehicleIds)
        .order('submitted_at', { ascending: false })

      if (dErr) throw dErr
      setDocs((docRows ?? []) as VehicleDoc[])

      // Auto-open first vehicle for convenience
      if (!openVehicleId && vList.length > 0) setOpenVehicleId(vList[0].id)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load vehicle compliance')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!vendorId) return
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorId])

  const requirementsMap = useMemo(() => {
    const map = new Map<string, boolean>()
    for (const r of reqs) map.set(r.doc_type, !!r.is_required)
    return map
  }, [reqs])

  function buildRowsForVehicle(vehicleId: string): Row[] {
    const latestByType = new Map<string, VehicleDoc>()
    for (const d of docs) {
      if (d.vehicle_id !== vehicleId) continue
      if (!latestByType.has(d.doc_type)) latestByType.set(d.doc_type, d)
    }

    const requiredTypes = Array.from(requirementsMap.keys()).sort()
    const out: Row[] = requiredTypes.map((t) => ({
      doc_type: t,
      required: requirementsMap.get(t) === true,
      latest: latestByType.get(t) ?? null,
    }))

    const extraTypes = Array.from(latestByType.keys()).filter((t) => !requirementsMap.has(t)).sort()
    for (const t of extraTypes) out.push({ doc_type: t, required: false, latest: latestByType.get(t) ?? null })

    return out
  }

  async function setStatus(doc: VehicleDoc, nextStatus: 'approved' | 'rejected') {
    setSaving(doc.id)
    setError(null)

    try {
      const { data: authData } = await supabase.auth.getUser()
      const reviewerId = authData?.user?.id ?? null

      let rejection_reason: string | null = null
      if (nextStatus === 'rejected') {
        const reason = window.prompt('Reason for rejection (required):', doc.rejection_reason ?? '')
        if (!reason || !reason.trim()) throw new Error('Rejection reason is required.')
        rejection_reason = reason.trim()
      }

      const payload: Partial<VehicleDoc> = {
        status: nextStatus,
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewerId,
        rejection_reason: nextStatus === 'rejected' ? rejection_reason : null,
      }

      const { error } = await supabase.from('vendor_vehicle_documents').update(payload).eq('id', doc.id)
      if (error) throw error

      // DB triggers recalc compliance_status for the vehicle
      await load()
    } catch (e: any) {
      setError(e?.message ?? 'Failed to update document')
    } finally {
      setSaving(null)
    }
  }

  function badge(status: string) {
    if (status === 'approved') return 'bg-green-50 text-green-700'
    if (status === 'rejected') return 'bg-red-50 text-red-700'
    if (status === 'pending') return 'bg-amber-50 text-amber-800'
    return 'bg-slate-100 text-slate-700'
  }

  const openVehicle = vehicles.find((v) => v.id === openVehicleId) ?? null
  const openRows = openVehicleId ? buildRowsForVehicle(openVehicleId) : []

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Vehicle Compliance</h1>
          <p className="text-sm text-slate-600">Approve / reject vehicle documents per truck.</p>
          <div className="mt-2 text-xs text-slate-500">
            Vendor ID: <span className="font-mono">{vendorId}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/vendors/${vendorId}/compliance`}
            className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50"
          >
            ← Business compliance
          </Link>
          <Link
            href={`/vendors/${vendorId}/vehicles`}
            className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50"
          >
            Vehicles
          </Link>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
      ) : null}

      {loading ? (
        <div className="rounded-xl border p-6 text-sm text-slate-600">Loading vehicle compliance…</div>
      ) : vehicles.length === 0 ? (
        <div className="rounded-xl border p-6 text-sm text-slate-600">No vehicles yet for this vendor.</div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
          {/* Left: vehicle list */}
          <div className="rounded-2xl border bg-white">
            <div className="border-b px-4 py-3 text-sm font-medium">Trucks</div>
            <div className="divide-y">
              {vehicles.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setOpenVehicleId(v.id)}
                  className={`w-full px-4 py-3 text-left hover:bg-slate-50 ${
                    openVehicleId === v.id ? 'bg-slate-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium">{v.label || 'Unnamed truck'}</div>
                    <span className={`rounded-full px-2 py-1 text-xs ${badge(v.compliance_status)}`}>
                      {v.compliance_status}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {v.plate_number ? v.plate_number : 'No plate'} • {v.is_suspended ? 'Suspended' : 'Active'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right: docs table for selected vehicle */}
          <div className="rounded-2xl border bg-white">
            <div className="border-b px-4 py-3">
              <div className="text-sm font-medium">
                {openVehicle ? (openVehicle.label || 'Truck') : 'Truck'} documents
              </div>
              <div className="text-xs text-slate-500">
                {openVehicle ? (
                  <>
                    <span className="font-mono">{openVehicle.id}</span>
                    {openVehicle.plate_number ? <span> • {openVehicle.plate_number}</span> : null}
                  </>
                ) : null}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Doc type</th>
                    <th className="px-4 py-3">Required</th>
                    <th className="px-4 py-3">Latest submission</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">File</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>

                <tbody>
                  {openRows.map((r) => {
                    const d = r.latest
                    const busy = d ? saving === d.id : false

                    return (
                      <tr key={r.doc_type} className="border-t">
                        <td className="px-4 py-3">
                          <div className="font-medium">{r.doc_type}</div>
                          {!r.required ? <div className="text-xs text-slate-500">extra</div> : null}
                        </td>

                        <td className="px-4 py-3">
                          {r.required ? (
                            <span className="rounded-full bg-slate-900 px-2 py-1 text-xs text-white">Yes</span>
                          ) : (
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">No</span>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          {d ? (
                            <span>{new Date(d.submitted_at).toLocaleString()}</span>
                          ) : (
                            <span className="text-slate-500">Not submitted</span>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          {d ? (
                            <span className={`rounded-full px-2 py-1 text-xs ${badge(d.status)}`}>{d.status}</span>
                          ) : (
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">—</span>
                          )}
                          {d?.status === 'rejected' && d.rejection_reason ? (
                            <div className="mt-1 text-xs text-red-700">Reason: {d.rejection_reason}</div>
                          ) : null}
                        </td>

                        <td className="px-4 py-3">
                          {d ? (
                            <div className="max-w-[340px] truncate font-mono text-xs text-slate-700" title={d.file_path}>
                              {d.file_path}
                            </div>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-right">
                          {d ? (
                            <div className="flex justify-end gap-2">
                              <button
                                disabled={busy}
                                onClick={() => setStatus(d, 'approved')}
                                className="rounded-lg border px-3 py-2 text-xs hover:bg-slate-50 disabled:opacity-60"
                              >
                                Approve
                              </button>
                              <button
                                disabled={busy}
                                onClick={() => setStatus(d, 'rejected')}
                                className="rounded-lg border px-3 py-2 text-xs hover:bg-slate-50 disabled:opacity-60"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500">Waiting for upload</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="border-t px-4 py-3 text-xs text-slate-500">
              Vehicle status updates automatically based on requirements + approvals.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
