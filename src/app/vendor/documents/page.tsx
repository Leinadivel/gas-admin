'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

const BUCKET = 'vendor-documents'

type VendorRow = { id: string; business_name: string | null }

type VehicleRow = { id: string; label: string | null; plate_number: string | null }

type BusinessDocRow = {
  id: string
  vendor_id: string
  doc_type: string
  file_path: string
  status: string | null
  submitted_at: string | null
  reviewed_at: string | null
  rejection_reason: string | null
  expires_at: string | null
}

type VehicleDocRow = {
  id: string
  vehicle_id: string
  doc_type: string
  file_path: string
  status: string | null
  submitted_at: string | null
  reviewed_at: string | null
  rejection_reason: string | null
  expires_at: string | null
}

function extFromName(name: string) {
  const i = name.lastIndexOf('.')
  return i >= 0 ? name.slice(i + 1).toLowerCase() : 'bin'
}

export default function VendorDocumentsPage() {
  const [tab, setTab] = useState<'business' | 'vehicle'>('business')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const [vendor, setVendor] = useState<VendorRow | null>(null)
  const [vehicles, setVehicles] = useState<VehicleRow[]>([])

  const [businessDocs, setBusinessDocs] = useState<BusinessDocRow[]>([])
  const [vehicleDocs, setVehicleDocs] = useState<VehicleDocRow[]>([])

  // upload form
  const [docType, setDocType] = useState('')
  const [expiresAt, setExpiresAt] = useState('') // YYYY-MM-DD
  const [vehicleId, setVehicleId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const vehiclesById = useMemo(() => {
    const m = new Map<string, VehicleRow>()
    for (const v of vehicles) m.set(v.id, v)
    return m
  }, [vehicles])

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

      // vendor
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
        setError('Vendor profile not found.')
        setLoading(false)
        return
      }

      const v = vendorRow as VendorRow
      setVendor(v)

      // vehicles (for vehicle-doc uploads + labeling)
      const vehiclesRes = await supabase
        .from('vendor_vehicles')
        .select('id,label,plate_number')
        .eq('vendor_id', v.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(200)

      // docs
      const [bizRes, vehRes] = await Promise.all([
        supabase
          .from('vendor_business_documents')
          .select('id,vendor_id,doc_type,file_path,status,submitted_at,reviewed_at,rejection_reason,expires_at')
          .eq('vendor_id', v.id)
          .order('submitted_at', { ascending: false })
          .limit(200),

        supabase
          .from('vendor_vehicle_documents')
          .select('id,vehicle_id,doc_type,file_path,status,submitted_at,reviewed_at,rejection_reason,expires_at')
          .order('submitted_at', { ascending: false })
          .limit(200),
      ])

      if (!mounted) return

      if (vehiclesRes.error) setError((p) => p ?? vehiclesRes.error!.message)
      setVehicles((vehiclesRes.data ?? []) as VehicleRow[])

      if (bizRes.error) setError((p) => p ?? bizRes.error!.message)
      setBusinessDocs((bizRes.data ?? []) as BusinessDocRow[])

      // Vehicle docs list will be RLS-filtered to this vendor’s vehicles (based on policy)
      if (vehRes.error) setError((p) => p ?? vehRes.error!.message)
      setVehicleDocs((vehRes.data ?? []) as VehicleDocRow[])

      setLoading(false)
    }

    load()

    const ch = supabase
      .channel('vendor-docs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vendor_business_documents' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vendor_vehicle_documents' }, load)
      .subscribe()

    return () => {
      mounted = false
      supabase.removeChannel(ch)
    }
  }, [])

  const resetForm = () => {
    setDocType('')
    setExpiresAt('')
    setVehicleId('')
    setFile(null)
  }

  const upload = async () => {
    setError(null)
    setNotice(null)

    if (!docType.trim()) {
      setError('doc_type is required.')
      return
    }
    if (!file) {
      setError('Select a file to upload.')
      return
    }
    if (!vendor) {
      setError('Vendor not loaded yet.')
      return
    }

    const { data: userData, error: userErr } = await supabase.auth.getUser()
    if (userErr) {
      setError(userErr.message)
      return
    }
    const authId = userData.user?.id
    if (!authId) {
      setError('Not logged in')
      return
    }

    if (tab === 'vehicle' && !vehicleId) {
      setError('Select a vehicle.')
      return
    }

    setUploading(true)

    try {
      const ext = extFromName(file.name)
      const safeType = docType.trim().toLowerCase().replace(/\s+/g, '_')
      const scope = tab === 'business' ? 'business' : 'vehicle'
      const targetId = tab === 'business' ? vendor.id : vehicleId

      // path uses auth uid so Storage RLS is simple: auth.uid()/...
      const path = `${authId}/${scope}/${targetId}/${safeType}_${Date.now()}.${ext}`

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: false })

      if (upErr) throw upErr

      if (tab === 'business') {
        const { error: insErr } = await supabase.from('vendor_business_documents').insert({
          vendor_id: vendor.id,
          doc_type: docType.trim(),
          file_path: path,
          status: 'pending',
          submitted_at: new Date().toISOString(),
          expires_at: expiresAt ? expiresAt : null,
        })
        if (insErr) throw insErr
      } else {
        const { error: insErr } = await supabase.from('vendor_vehicle_documents').insert({
          vehicle_id: vehicleId,
          doc_type: docType.trim(),
          file_path: path,
          status: 'pending',
          submitted_at: new Date().toISOString(),
          expires_at: expiresAt ? expiresAt : null,
        })
        if (insErr) throw insErr
      }

      setNotice('Uploaded. Status is now pending review.')
      resetForm()
    } catch (e: any) {
      setError(e?.message ?? 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const getSignedUrl = async (path: string) => {
    // Signed URLs work regardless of bucket public/private
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60)
    if (error) throw error
    return data.signedUrl
  }

  const openFile = async (path: string) => {
    try {
      const url = await getSignedUrl(path)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (e: any) {
      setError(e?.message ?? 'Failed to open file')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Documents</h1>
          <p className="text-sm opacity-70">
            {vendor?.business_name ?? 'Vendor'} compliance uploads
          </p>
        </div>

        <div className="inline-flex rounded-md border bg-white overflow-hidden">
          <button
            onClick={() => setTab('business')}
            className={[
              'px-3 py-2 text-sm',
              tab === 'business' ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50',
            ].join(' ')}
          >
            Business
          </button>
          <button
            onClick={() => setTab('vehicle')}
            className={[
              'px-3 py-2 text-sm',
              tab === 'vehicle' ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50',
            ].join(' ')}
          >
            Vehicle
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {notice ? (
        <div className="rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700">
          {notice}
        </div>
      ) : null}

      {/* Upload box */}
      <div className="rounded-xl border bg-white p-4 space-y-4 max-w-2xl">
        <div className="text-sm font-medium">
          Upload {tab === 'business' ? 'business' : 'vehicle'} document
        </div>

        {tab === 'vehicle' ? (
          <div className="space-y-2">
            <label className="text-sm font-medium">Vehicle</label>
            <select
              className="w-full rounded-md border px-3 py-2 bg-white"
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              disabled={loading}
            >
              <option value="">Select vehicle…</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {(v.label ?? 'Vehicle') + (v.plate_number ? ` • ${v.plate_number}` : '')}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Document type (doc_type)</label>
            <input
              className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2"
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              placeholder={tab === 'business' ? 'CAC, TIN, Business License…' : 'Vehicle Reg, Insurance…'}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Expiry date (optional)</label>
            <input
              className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">File</label>
          <input
            type="file"
            className="w-full rounded-md border px-3 py-2 bg-white"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <div className="text-xs opacity-60">
            Stored in bucket <code>{BUCKET}</code> under <code>{'{auth.uid()}/...'}</code>.
          </div>
        </div>

        <button
          onClick={upload}
          disabled={uploading || loading}
          className="rounded-md bg-black text-white px-4 py-2 text-sm disabled:opacity-60"
        >
          {uploading ? 'Uploading…' : 'Upload document'}
        </button>
      </div>

      {/* Lists */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm font-medium">
            {tab === 'business' ? 'Business documents' : 'Vehicle documents'}
          </div>

          <div className="mt-3 divide-y">
            {loading ? (
              <div className="py-6 text-sm opacity-70">Loading…</div>
            ) : tab === 'business' ? (
              businessDocs.length === 0 ? (
                <div className="py-6 text-sm opacity-70">No business documents yet.</div>
              ) : (
                businessDocs.map((d) => (
                  <DocRow
                    key={d.id}
                    title={d.doc_type}
                    status={d.status}
                    submittedAt={d.submitted_at}
                    expiresAt={d.expires_at}
                    rejectionReason={d.rejection_reason}
                    onOpen={() => openFile(d.file_path)}
                  />
                ))
              )
            ) : vehicleDocs.length === 0 ? (
              <div className="py-6 text-sm opacity-70">No vehicle documents yet.</div>
            ) : (
              vehicleDocs.map((d) => {
                const v = vehiclesById.get(d.vehicle_id)
                const vehicleLabel = v
                  ? `${v.label ?? 'Vehicle'}${v.plate_number ? ` • ${v.plate_number}` : ''}`
                  : d.vehicle_id
                return (
                  <DocRow
                    key={d.id}
                    title={`${d.doc_type} • ${vehicleLabel}`}
                    status={d.status}
                    submittedAt={d.submitted_at}
                    expiresAt={d.expires_at}
                    rejectionReason={d.rejection_reason}
                    onOpen={() => openFile(d.file_path)}
                  />
                )
              })
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm font-medium">How review works</div>
          <div className="mt-2 text-sm opacity-70 space-y-2">
            <p>
              Uploads start as <b>pending</b>.
            </p>
            <p>
              Admin reviews and sets <b>approved</b> or <b>rejected</b> (with a reason).
            </p>
            <p>
              If rejected, re-upload the corrected document.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function DocRow({
  title,
  status,
  submittedAt,
  expiresAt,
  rejectionReason,
  onOpen,
}: {
  title: string
  status: string | null
  submittedAt: string | null
  expiresAt: string | null
  rejectionReason: string | null
  onOpen: () => void
}) {
  return (
    <div className="py-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium">{title}</div>
          <div className="mt-1 text-xs opacity-60">
            Submitted: {submittedAt ? new Date(submittedAt).toLocaleString() : '—'}
            {expiresAt ? ` • Expires: ${expiresAt}` : ''}
          </div>
          {status === 'rejected' && rejectionReason ? (
            <div className="mt-1 text-xs text-red-700">Reason: {rejectionReason}</div>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs rounded-md border px-2 py-1 bg-white">
            {status ?? '—'}
          </span>
          <button
            onClick={onOpen}
            className="rounded-md border bg-white px-3 py-2 text-xs hover:bg-gray-50"
          >
            View
          </button>
        </div>
      </div>
    </div>
  )
}
