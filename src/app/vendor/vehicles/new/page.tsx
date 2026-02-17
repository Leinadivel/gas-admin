'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

type VendorRow = { id: string }

export default function VendorNewVehiclePage() {
  const [loading, setLoading] = useState(false)
  const [pageError, setPageError] = useState<string | null>(null)

  const [vendor, setVendor] = useState<VendorRow | null>(null)

  const [label, setLabel] = useState('')
  const [plate, setPlate] = useState('')

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const init = async () => {
      setPageError(null)

      const { data: userData, error: userErr } = await supabase.auth.getUser()
      if (userErr) {
        if (mounted) setPageError(userErr.message)
        return
      }

      const authId = userData.user?.id
      if (!authId) {
        if (mounted) setPageError('Not logged in')
        return
      }

      const { data: vendorRow, error: vendorErr } = await supabase
        .from('vendors')
        .select('id')
        .or(`id.eq.${authId},user_id.eq.${authId},profile_id.eq.${authId}`)
        .maybeSingle()

      if (!mounted) return

      if (vendorErr) {
        setPageError(vendorErr.message)
        return
      }

      if (!vendorRow) {
        setPageError('Vendor profile not found for this account.')
        return
      }

      setVendor(vendorRow as VendorRow)
    }

    init()
    return () => {
      mounted = false
    }
  }, [])

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!vendor?.id) {
      setError('Vendor not loaded yet.')
      return
    }

    setLoading(true)

    const { error: insertErr } = await supabase.from('vendor_vehicles').insert({
      vendor_id: vendor.id,
      label: label.trim() || null,
      plate_number: plate.trim() || null,
      is_active: true,
      is_online: false,
    })

    setLoading(false)

    if (insertErr) {
      setError(insertErr.message)
      return
    }

    setSuccess('Vehicle added.')
    setLabel('')
    setPlate('')
  }

  return (
    <div className="max-w-lg space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Add vehicle</h1>
        <p className="text-sm opacity-70">Create a new vehicle for your fleet.</p>
      </div>

      {pageError ? (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {pageError}
        </div>
      ) : null}

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

      <form onSubmit={onCreate} className="rounded-xl border bg-white p-4 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Label</label>
          <input
            className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Bike 1 / Truck A"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Plate number</label>
          <input
            className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2"
            value={plate}
            onChange={(e) => setPlate(e.target.value)}
            placeholder="e.g. ABC-123XY"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading || !!pageError}
            className="rounded-md bg-black text-white px-4 py-2 text-sm disabled:opacity-60"
          >
            {loading ? 'Saving…' : 'Add vehicle'}
          </button>

          <Link
            href="/vendor/vehicles"
            className="rounded-md border bg-white px-4 py-2 text-sm hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
