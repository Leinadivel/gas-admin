'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

type ProfileRow = {
  id: string
  role: string
  full_name: string | null
  phone: string | null
  created_at: string
}

export default function AdminProfilesPage() {
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<ProfileRow[]>([])
  const [error, setError] = useState<string | null>(null)

  const [q, setQ] = useState('')
  const [role, setRole] = useState<string>('all')

  const roles = useMemo(() => {
    const s = new Set<string>()
    rows.forEach((r) => s.add(r.role))
    return Array.from(s).sort()
  }, [rows])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return rows.filter((r) => {
      const matchesRole = role === 'all' ? true : r.role === role
      const hay = [r.id, r.role, r.full_name ?? '', r.phone ?? '']
        .join(' ')
        .toLowerCase()
      const matchesQuery = query ? hay.includes(query) : true
      return matchesRole && matchesQuery
    })
  }, [rows, q, role])

  useEffect(() => {
    let mounted = true

    const load = async () => {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('profiles')
        .select('id,role,full_name,phone,created_at')
        .order('created_at', { ascending: false })
        .limit(500)

      if (!mounted) return

      if (error) {
        setError(error.message)
        setRows([])
      } else {
        setRows((data ?? []) as ProfileRow[])
      }

      setLoading(false)
    }

    load()

    const channel = supabase
      .channel('admin-profiles')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => load()
      )
      .subscribe()

    return () => {
      mounted = false
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Profiles</h1>
          <p className="text-sm opacity-70">Latest 500 (realtime).</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            className="w-full sm:w-72 rounded-md border bg-white px-3 py-2 outline-none focus:ring-2"
            placeholder="Search id, name, phone…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <select
            className="w-full sm:w-48 rounded-md border bg-white px-3 py-2 outline-none focus:ring-2"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="all">All roles</option>
            {roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
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
              <th className="px-4 py-3">Profile ID</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Full name</th>
              <th className="px-4 py-3">Phone</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-6 opacity-70" colSpan={5}>
                  Loading…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td className="px-4 py-6 opacity-70" colSpan={5}>
                  No profiles found.
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="border-b last:border-b-0">
                  <td className="px-4 py-3 whitespace-nowrap">
                    {new Date(p.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-mono">{p.id}</td>
                  <td className="px-4 py-3">{p.role}</td>
                  <td className="px-4 py-3">{p.full_name ?? '—'}</td>
                  <td className="px-4 py-3">{p.phone ?? '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
