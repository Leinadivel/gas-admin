'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { ArrowLeft, Car, CheckCircle2, ShieldCheck, Tag } from 'lucide-react'

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
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4">
        <Link
          href="/vendor/vehicles"
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 transition hover:border-blue-200 hover:text-blue-600"
        >
          <ArrowLeft size={16} />
          Back to vehicles
        </Link>

        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-blue-100 p-3 text-blue-600">
            <Car size={22} />
          </div>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
              Add vehicle
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Create a new vehicle and add it to your fleet for assignments and operations.
            </p>
          </div>
        </div>
      </div>

      {pageError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {pageError}
        </div>
      ) : null}

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
        <form
          onSubmit={onCreate}
          className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="mb-6">
            <h2 className="text-base font-semibold text-gray-900">Vehicle details</h2>
            <p className="mt-1 text-sm text-gray-500">
              Fill in the vehicle information below to add it to your fleet.
            </p>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Label</label>
              <div className="relative">
                <Tag
                  size={18}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. Bike 1 / Truck A"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Plate number</label>
              <div className="relative">
                <Car
                  size={18}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  value={plate}
                  onChange={(e) => setPlate(e.target.value)}
                  placeholder="e.g. ABC-123XY"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 border-t border-gray-100 pt-5 sm:flex-row">
            <button
              type="submit"
              disabled={loading || !!pageError}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CheckCircle2 size={16} />
              {loading ? 'Saving…' : 'Add vehicle'}
            </button>

            <Link
              href="/vendor/vehicles"
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </Link>
          </div>
        </form>

        <div className="space-y-4">
          <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <div className="rounded-xl bg-blue-100 p-2 text-blue-600">
                <ShieldCheck size={18} />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">What happens next</h3>
            </div>

            <div className="space-y-3 text-sm text-gray-600">
              <div className="rounded-xl border border-white/80 bg-white/80 p-3">
                The vehicle will be added to your active fleet.
              </div>
              <div className="rounded-xl border border-white/80 bg-white/80 p-3">
                It will be available for driver assignment and tracking workflows.
              </div>
              <div className="rounded-xl border border-white/80 bg-white/80 p-3">
                New vehicles start as active and offline by default.
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-orange-100 bg-orange-50 p-5">
            <h3 className="text-sm font-semibold text-gray-900">Helpful tip</h3>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Use clear vehicle labels so your team can quickly identify each unit during
              assignment and dispatch.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}