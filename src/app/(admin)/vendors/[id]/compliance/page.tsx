'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

type Requirement = {
  id: string
  scope: 'business' | 'vehicle'
  doc_type: string
  is_required: boolean
  is_active: boolean
}

type BusinessDoc = {
  id: string
  vendor_id: string
  doc_type: string
  file_path: string
  status: 'pending' | 'approved' | 'rejected'
  submitted_at: string
  reviewed_at: string | null
  reviewed_by: string | null
  rejection_reason: string | null
  expires_at: string | null
}

type VendorRow = {
  id: string
  compliance_status: 'unsubmitted' | 'pending' | 'approved' | 'rejected'
}

type Row = {
  doc_type: string
  required: boolean
  latest: BusinessDoc | null
}

export default function VendorBusinessCompliancePage() {
  const params = useParams<{ id: string }>()
  const vendorId = params.id
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [vendor, setVendor] = useState<VendorRow | null>(null)
  const [reqs, setReqs] = useState<Requirement[]>([])
  const [docs, setDocs] = useState<BusinessDoc[]>([])

  async function load() {
    setLoading(true)
    setError(null)

    try {
      const [{ data: vendorRow, error: vErr }, { data: reqRows, error: rErr }, { data: docRows, error: dErr }] =
        await Promise.all([
          supabase.from('vendors').select('id,compliance_status').eq('id', vendorId).maybeSingle(),
          supabase
            .from('compliance_requirements')
            .select('id,scope,doc_type,is_required,is_active')
            .eq('scope', 'business')
            .eq('is_active', true)
            .order('doc_type', { ascending: true }),
          supabase
            .from('vendor_business_documents')
            .select(
              'id,vendor_id,doc_type,file_path,status,submitted_at,reviewed_at,reviewed_by,rejection_reason,expires_at'
            )
            .eq('vendor_id', vendorId)
            .order('submitted_at', { ascending: false }),
        ])

      if (vErr) throw vErr
      if (!vendorRow) throw new Error('Vendor not found')
      if (rErr) throw rErr
      if (dErr) throw dErr

      setVendor(vendorRow as VendorRow)
      setReqs((reqRows ?? []) as Requirement[])
      setDocs((docRows ?? []) as BusinessDoc[])
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load compliance data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!vendorId) return
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorId])

  const rows: Row[] = useMemo(() => {
    const requiredSet = new Map<string, boolean>()
    for (const r of reqs) requiredSet.set(r.doc_type, !!r.is_required)

    // Group latest doc by type (docs already sorted desc)
    const latestByType = new Map<string, BusinessDoc>()
    for (const d of docs) {
      if (!latestByType.has(d.doc_type)) latestByType.set(d.doc_type, d)
    }

    // Include required types first
    const requiredTypes = Array.from(requiredSet.keys()).sort()
    const out: Row[] = requiredTypes.map((t) => ({
      doc_type: t,
      required: requiredSet.get(t) === true,
      latest: latestByType.get(t) ?? null,
    }))

    // Include non-required submitted types (extras) at bottom
    const extraTypes = Array.from(latestByType.keys()).filter((t) => !requiredSet.has(t)).sort()
    for (const t of extraTypes) {
      out.push({ doc_type: t, required: false, latest: latestByType.get(t) ?? null })
    }

    return out
  }, [reqs, docs])

  async function setStatus(doc: BusinessDoc, nextStatus: 'approved' | 'rejected') {
    setSaving(doc.id)
    setError(null)

    try {
      const { data: authData } = await supabase.auth.getUser()
      const reviewerId = authData?.user?.id ?? null

      let rejection_reason: string | null = null
      if (nextStatus === 'rejected') {
        const reason = window.prompt('Reason for rejection (required):', doc.rejection_reason ?? '')
        if (!reason || !reason.trim()) {
          throw new Error('Rejection reason is required.')
        }
        rejection_reason = reason.trim()
      }

      const payload: Partial<BusinessDoc> = {
        status: nextStatus,
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewerId,
        rejection_reason: nextStatus === 'rejected' ? rejection_reason : null,
      }

      const { error } = await supabase.from('vendor_business_documents').update(payload).eq('id', doc.id)
      if (error) throw error

      // Triggers recalc vendor compliance automatically
      await load()
    } catch (e: any) {
      setError(e?.message ?? 'Failed to update document')
    } finally {
      setSaving(null)
    }
  }

  function statusBadge(status: string) {
    if (status === 'approved') return 'bg-green-50 text-green-700'
    if (status === 'rejected') return 'bg-red-50 text-red-700'
    if (status === 'pending') return 'bg-amber-50 text-amber-800'
    return 'bg-slate-100 text-slate-700'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Business Compliance</h1>
          <p className="text-sm text-slate-600">
            Review vendor business documents. Status updates automatically based on requirements.
          </p>

          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-slate-100 px-2 py-1">
              Vendor status:{' '}
              <span className="font-medium">{vendor?.compliance_status ?? '—'}</span>
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-1">Vendor ID: <span className="font-mono">{vendorId}</span></span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/vendors/${vendorId}/vehicles/compliance`)}
            className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50"
          >
            Vehicle compliance →
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
        <div className="rounded-xl border p-6 text-sm text-slate-600">Loading compliance…</div>
      ) : (
        <div className="rounded-2xl border bg-white">
          <div className="border-b px-4 py-3">
            <div className="text-sm font-medium">Required documents</div>
            <div className="text-xs text-slate-500">
              Requirements come from <span className="font-mono">compliance_requirements</span> (scope=business).
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
                {rows.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-slate-600" colSpan={6}>
                      No requirements set yet. Add rows to <span className="font-mono">compliance_requirements</span>.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => {
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
                            <span className="text-slate-700">{new Date(d.submitted_at).toLocaleString()}</span>
                          ) : (
                            <span className="text-slate-500">Not submitted</span>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          {d ? (
                            <span className={`rounded-full px-2 py-1 text-xs ${statusBadge(d.status)}`}>
                              {d.status}
                            </span>
                          ) : (
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                              —
                            </span>
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
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t px-4 py-3 text-xs text-slate-500">
            Next: we’ll build Vehicle compliance review (per truck) + document download preview.
          </div>
        </div>
      )}
    </div>
  )
}
