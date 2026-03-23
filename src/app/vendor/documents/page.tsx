'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import {
  Building2,
  CalendarDays,
  Car,
  Eye,
  FileText,
  ShieldCheck,
  Upload,
} from 'lucide-react'

const BUCKET = 'vendor-documents'

type VendorRow = {
  id: string
  business_name: string | null
  profile_id?: string | null
  user_id?: string | null
  created_at?: string | null
}

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

  const [docType, setDocType] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [vehicleId, setVehicleId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const vehiclesById = useMemo(() => {
    const m = new Map<string, VehicleRow>()
    for (const v of vehicles) m.set(v.id, v)
    return m
  }, [vehicles])

  const currentDocs = tab === 'business' ? businessDocs : vehicleDocs

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
        setError('Vendor profile not found.')
        setLoading(false)
        return
      }

      setVendor(vendorRow)

      const vehiclesRes = await supabase
        .from('vendor_vehicles')
        .select('id,label,plate_number')
        .eq('vendor_id', vendorRow.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(200)

      const [bizRes, vehRes] = await Promise.all([
        supabase
          .from('vendor_business_documents')
          .select(
            'id,vendor_id,doc_type,file_path,status,submitted_at,reviewed_at,rejection_reason,expires_at'
          )
          .eq('vendor_id', vendorRow.id)
          .order('submitted_at', { ascending: false })
          .limit(200),

        supabase
          .from('vendor_vehicle_documents')
          .select(
            'id,vehicle_id,doc_type,file_path,status,submitted_at,reviewed_at,rejection_reason,expires_at'
          )
          .order('submitted_at', { ascending: false })
          .limit(200),
      ])

      if (!mounted) return

      if (vehiclesRes.error) setError((p) => p ?? vehiclesRes.error!.message)
      setVehicles((vehiclesRes.data ?? []) as VehicleRow[])

      if (bizRes.error) setError((p) => p ?? bizRes.error!.message)
      setBusinessDocs((bizRes.data ?? []) as BusinessDocRow[])

      if (vehRes.error) setError((p) => p ?? vehRes.error!.message)
      setVehicleDocs((vehRes.data ?? []) as VehicleDocRow[])

      setLoading(false)
    }

    load()

    const ch = supabase
      .channel('vendor-docs')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'vendor_business_documents' },
        load
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'vendor_vehicle_documents' },
        load
      )
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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-blue-100 p-3 text-blue-600">
            <FileText size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Documents</h1>
            <p className="mt-1 text-sm text-gray-500">
              {vendor?.business_name ?? 'Vendor'} compliance uploads
            </p>
          </div>
        </div>

        <div className="inline-flex w-full overflow-hidden rounded-xl border border-gray-200 bg-white p-1 sm:w-auto">
          <button
            onClick={() => setTab('business')}
            className={[
              'inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition sm:flex-none',
              tab === 'business'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-50',
            ].join(' ')}
          >
            <Building2 size={16} />
            Business
          </button>
          <button
            onClick={() => setTab('vehicle')}
            className={[
              'inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition sm:flex-none',
              tab === 'vehicle'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-50',
            ].join(' ')}
          >
            <Car size={16} />
            Vehicle
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {notice ? (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {notice}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-6 flex items-start gap-3">
            <div className="rounded-xl bg-orange-50 p-2 text-orange-600">
              <Upload size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Upload {tab === 'business' ? 'business' : 'vehicle'} document
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Add required compliance files and keep records up to date.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            {tab === 'vehicle' ? (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Vehicle</label>
                <select
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-gray-50"
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

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Document type</label>
                <input
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  placeholder={
                    tab === 'business'
                      ? 'CAC, TIN, Business License…'
                      : 'Vehicle Reg, Insurance…'
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Expiry date</label>
                <div className="relative">
                  <CalendarDays
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">File</label>
              <input
                type="file"
                className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-gray-400">
                Upload clear, valid files for faster review.
              </p>
            </div>

            <button
              onClick={upload}
              disabled={uploading || loading}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Upload size={16} />
              {uploading ? 'Uploading…' : 'Upload document'}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <div className="rounded-xl bg-blue-100 p-2 text-blue-600">
                <ShieldCheck size={18} />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Review process</h3>
            </div>

            <div className="space-y-3 text-sm text-gray-600">
              <div className="rounded-xl border border-white/80 bg-white/80 p-3">
                Uploaded documents start as <span className="font-medium text-gray-900">pending</span>.
              </div>
              <div className="rounded-xl border border-white/80 bg-white/80 p-3">
                Admin reviews and marks them as <span className="font-medium text-gray-900">approved</span> or <span className="font-medium text-gray-900">rejected</span>.
              </div>
              <div className="rounded-xl border border-white/80 bg-white/80 p-3">
                If rejected, re-upload the corrected file with the required update.
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <MiniStat
              label="Business docs"
              value={loading ? '—' : String(businessDocs.length)}
              icon={<Building2 size={16} />}
              accent="blue"
            />
            <MiniStat
              label="Vehicle docs"
              value={loading ? '—' : String(vehicleDocs.length)}
              icon={<Car size={16} />}
              accent="orange"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-gray-900">
            {tab === 'business' ? 'Business documents' : 'Vehicle documents'}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            View uploaded files and track their current review status.
          </p>
        </div>

        <div className="divide-y divide-gray-100">
          {loading ? (
            <div className="px-5 py-12 text-center text-sm text-gray-500">Loading documents...</div>
          ) : currentDocs.length === 0 ? (
            <div className="px-5 py-12">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="mb-3 rounded-full bg-gray-100 p-3 text-gray-400">
                  <FileText size={22} />
                </div>
                <h3 className="text-sm font-semibold text-gray-900">No documents uploaded yet</h3>
                <p className="mt-1 max-w-sm text-sm text-gray-500">
                  Upload your {tab === 'business' ? 'business' : 'vehicle'} compliance files to get
                  started.
                </p>
              </div>
            </div>
          ) : tab === 'business' ? (
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
    </div>
  )
}

function MiniStat({
  label,
  value,
  icon,
  accent,
}: {
  label: string
  value: string
  icon: React.ReactNode
  accent: 'blue' | 'orange'
}) {
  const accentClass =
    accent === 'blue' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span className={`rounded-lg p-2 ${accentClass}`}>{icon}</span>
        {label}
      </div>
      <div className="mt-3 text-2xl font-semibold text-gray-900">{value}</div>
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
  const badgeClass =
    status === 'approved'
      ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-200'
      : status === 'rejected'
      ? 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200'
      : 'bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-200'

  return (
    <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="text-sm font-medium text-gray-900">{title}</div>
        <div className="mt-1 text-xs text-gray-500">
          Submitted: {submittedAt ? new Date(submittedAt).toLocaleString() : '—'}
          {expiresAt ? ` • Expires: ${expiresAt}` : ''}
        </div>
        {status === 'rejected' && rejectionReason ? (
          <div className="mt-2 text-xs text-red-700">Reason: {rejectionReason}</div>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${badgeClass}`}>
          {status ?? '—'}
        </span>
        <button
          onClick={onOpen}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
        >
          <Eye size={14} />
          View
        </button>
      </div>
    </div>
  )
}