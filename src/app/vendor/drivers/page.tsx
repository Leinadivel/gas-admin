'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

type StaffRow = {
  id: string
  vendor_id: string
  user_id: string | null
  role: string | null
  vehicle_id: string | null
  is_active: boolean
  created_at: string
}

type VendorRow = {
  id: string
  business_name: string | null
}

export default function VendorDriversPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')

  const [vendor, setVendor] = useState<VendorRow | null>(null)
  const [staff, setStaff] = useState<StaffRow[]>([])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return staff
    return staff.filter((s) => {
      const hay = [s.id, s.user_id ?? '', s.role ?? '', s.vehicle_id ?? '']
        .join(' ')
        .toLowerCase()
      return hay.includes(query)
    })
  }, [staff, q])

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

      // Get vendor row (same logic as dashboard)
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

      // Load staff/drivers
      const { data: staffRows, error: staffErr } = await supabase
        .from('vendor_staff')
        .select('id,vendor_id,user_id,role,vehicle_id,is_active,created_at')
        .eq('vendor_id', v.id)
        .order('created_at', { ascending: false })
        .limit(200)

      if (!mounted) return

      if (staffErr) {
        setError(staffErr.message)
        setStaff([])
      } else {
        setStaff((staffRows ?? []) as StaffRow[])
      }

      setLoading(false)
    }

    load()

    const ch = supabase
      .channel('vendor-staff')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vendor_staff' }, load)
      .subscribe()

    return () => {
      mounted = false
      supabase.removeChannel(ch)
    }
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Drivers</h1>
          <p className="text-sm opacity-70">
            {vendor?.business_name ? `${vendor.business_name} staff` : 'Your drivers and staff'}
          </p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <input
            className="w-full sm:w-80 rounded-md border bg-white px-3 py-2 outline-none focus:ring-2"
            placeholder="Search: role, user_id, vehicle_id…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <Link
            href="/vendor/drivers/new"
            className="rounded-md bg-black text-white px-4 py-2 text-sm whitespace-nowrap"
          >
            Add driver
          </Link>
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="min-w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr className="text-left">
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Staff ID</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">User ID</th>
              <th className="px-4 py-3">Vehicle</th>
              <th className="px-4 py-3">Active</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-6 opacity-70" colSpan={6}>
                  Loading…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td className="px-4 py-6 opacity-70" colSpan={6}>
                  No drivers/staff found.
                </td>
              </tr>
            ) : (
              filtered.map((s) => (
                <tr key={s.id} className="border-b last:border-b-0">
                  <td className="px-4 py-3 whitespace-nowrap">
                    {s.created_at ? new Date(s.created_at).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3 font-mono">{s.id}</td>
                  <td className="px-4 py-3">{s.role ?? '—'}</td>
                  <td className="px-4 py-3 font-mono">{s.user_id ?? '—'}</td>
                  <td className="px-4 py-3 font-mono">{s.vehicle_id ?? '—'}</td>
                  <td className="px-4 py-3">{s.is_active ? 'Yes' : 'No'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="text-xs opacity-60">
        Next: we’ll build <code>/vendor/drivers/new</code> to invite/create drivers and assign vehicles.
      </div>
    </div>
  )
}
