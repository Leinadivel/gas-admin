'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

type TxRow = {
  id: string
  vendor_id: string
  order_id: string | null
  user_id: string | null
  amount: number
  type: string
  status: string | null
  created_at: string
}

export default function AdminTransactionsPage() {
  const [loading, setLoading] = useState(true)
  const [txs, setTxs] = useState<TxRow[]>([])
  const [error, setError] = useState<string | null>(null)

  const [q, setQ] = useState('')
  const [type, setType] = useState<string>('all')

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return txs.filter((t) => {
      const matchesType = type === 'all' ? true : t.type === type
      const hay = [
        t.id,
        t.vendor_id,
        t.order_id ?? '',
        t.user_id ?? '',
        t.type,
        t.status ?? '',
        String(t.amount),
      ]
        .join(' ')
        .toLowerCase()

      const matchesQuery = query ? hay.includes(query) : true
      return matchesType && matchesQuery
    })
  }, [txs, q, type])

  const types = useMemo(() => {
    const s = new Set<string>()
    txs.forEach((t) => s.add(t.type))
    return Array.from(s).sort()
  }, [txs])

  useEffect(() => {
    let mounted = true

    const load = async () => {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('transactions')
        .select('id,vendor_id,order_id,amount,type,created_at,user_id,status')
        .order('created_at', { ascending: false })
        .limit(300)

      if (!mounted) return

      if (error) {
        setError(error.message)
        setTxs([])
      } else {
        setTxs((data ?? []) as TxRow[])
      }

      setLoading(false)
    }

    load()

    const channel = supabase
      .channel('admin-transactions')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
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
          <h1 className="text-2xl font-semibold">Transactions</h1>
          <p className="text-sm opacity-70">Latest 300 (realtime).</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            className="w-full sm:w-72 rounded-md border bg-white px-3 py-2 outline-none focus:ring-2"
            placeholder="Search id, order, vendor, user, amount…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <select
            className="w-full sm:w-56 rounded-md border bg-white px-3 py-2 outline-none focus:ring-2"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="all">All types</option>
            {types.map((t) => (
              <option key={t} value={t}>
                {t}
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
              <th className="px-4 py-3">Tx ID</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Vendor</th>
              <th className="px-4 py-3">User</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-6 opacity-70" colSpan={8}>
                  Loading…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td className="px-4 py-6 opacity-70" colSpan={8}>
                  No transactions found.
                </td>
              </tr>
            ) : (
              filtered.map((t) => (
                <tr key={t.id} className="border-b last:border-b-0">
                  <td className="px-4 py-3 whitespace-nowrap">
                    {new Date(t.created_at).toLocaleString()}
                  </td>

                  <td className="px-4 py-3 font-mono">{t.id}</td>
                  <td className="px-4 py-3">{t.type}</td>
                  <td className="px-4 py-3">{t.status ?? '—'}</td>
                  <td className="px-4 py-3">{String(t.amount)}</td>

                  <td className="px-4 py-3 font-mono">
                    {t.order_id ? (
                      <Link
                        href={`/orders/${t.order_id}`}
                        className="underline underline-offset-2 hover:opacity-80"
                      >
                        {t.order_id}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </td>

                  <td className="px-4 py-3 font-mono">{t.vendor_id}</td>
                  <td className="px-4 py-3 font-mono">{t.user_id ?? '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
