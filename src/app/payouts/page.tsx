'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

type VendorMini = {
  business_name: string | null
  bank_name: string | null
  bank_code: string | null
  account_number: string | null
  account_name: string | null
  paystack_recipient_code: string | null
}

type PayoutRow = {
  id: string
  vendor_id: string
  amount: number
  status: string
  requested_at: string
  reviewed_at: string | null
  reviewed_by: string | null
  rejection_reason: string | null
  paystack_reference: string | null

  // ✅ server route returns OBJECT, not array
  vendors: VendorMini | null
}

const STATUS = ['all', 'pending', 'approved', 'rejected', 'paid', 'cancelled'] as const

export default function AdminPayoutsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const [rows, setRows] = useState<PayoutRow[]>([])
  const [status, setStatus] = useState<(typeof STATUS)[number]>('pending')
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    let data = rows
    if (status !== 'all') data = data.filter((r) => r.status === status)
    if (!query) return data

    return data.filter((r) => {
      const v = r.vendors
      const hay = [
        r.id,
        r.vendor_id,
        r.status,
        String(r.amount ?? ''),
        v?.business_name ?? '',
        v?.bank_name ?? '',
        v?.bank_code ?? '',
        v?.account_number ?? '',
        v?.account_name ?? '',
        v?.paystack_recipient_code ?? '',
      ]
        .join(' ')
        .toLowerCase()
      return hay.includes(query)
    })
  }, [rows, status, q])

  // ✅ Load from server (bypasses RLS)
  const load = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/payouts', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      })

      const json = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(json?.error || `Failed to load payouts (${res.status})`)
      }

      setRows((json?.data ?? []) as PayoutRow[])
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load payouts')
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      if (!mounted) return
      await load()
    })()

    // ✅ realtime trigger (no join needed here)
    const ch = supabase
      .channel('admin-payouts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vendor_payout_requests' }, () => {
        load()
      })
      .subscribe()

    return () => {
      mounted = false
      supabase.removeChannel(ch)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const approve = async (id: string) => {
    setError(null)
    setNotice(null)
    const { error } = await supabase.rpc('admin_approve_payout_request', { p_request_id: id })
    if (error) setError(error.message)
    else setNotice('Approved.')
  }

  const reject = async (id: string) => {
    const reason = window.prompt('Rejection reason (required):') ?? ''
    if (!reason.trim()) return

    setError(null)
    setNotice(null)
    const { error } = await supabase.rpc('admin_reject_payout_request', {
      p_request_id: id,
      p_reason: reason.trim(),
    })
    if (error) setError(error.message)
    else setNotice('Rejected.')
  }

  const markPaid = async (id: string) => {
    const ref =
      window.prompt(
        'Enter transfer reference (optional). If you paid manually, paste your bank transfer reference here:'
      ) ?? ''

    const ok = window.confirm(
      'Confirm you have already paid this vendor (manual transfer). This will mark the payout as PAID and debit the vendor wallet. Continue?'
    )
    if (!ok) return

    setError(null)
    setNotice(null)

    const { error } = await supabase.rpc('admin_mark_payout_request_paid', {
      p_request_id: id,
      p_paystack_reference: ref.trim() ? ref.trim() : null,
    })

    if (error) setError(error.message)
    else setNotice('Marked as PAID ✅ (manual payout recorded).')
  }

  // ✅ Mark paid triggers Paystack transfer server-side
  // const markPaid = async (id: string) => {
  //   const ok = window.confirm(
  //     'This will initiate a Paystack transfer to the vendor bank account and then mark this payout as PAID. Continue?'
  //   )
  //   if (!ok) return

  //   setError(null)
  //   setNotice(null)

  //   try {
  //     const res = await fetch('/api/paystack/transfer', {
  //       method: 'POST',
  //       credentials: 'include',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ request_id: id }),
  //     })

  //     const json = await res.json().catch(() => ({}))

  //     if (!res.ok) {
  //       throw new Error(json?.error || `Transfer failed (${res.status})`)
  //     }

  //     const code = json?.transfer?.transfer_code ?? json?.transfer?.reference ?? ''
  //     setNotice(
  //       code
  //         ? `Transfer started ✅ (${code}). Payout marked as PAID.`
  //         : 'Transfer started ✅. Payout marked as PAID.'
  //     )

  //     // refresh table
  //     load()
  //   } catch (e: any) {
  //     setError(e?.message ?? 'Transfer failed')
  //   }
  // }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Payouts</h1>
          <p className="text-sm opacity-70">Approve, reject, and mark payouts as paid.</p>
        </div>

        <div className="flex gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="rounded-md border bg-white px-3 py-2 text-sm"
          >
            {STATUS.map((s) => (
              <option key={s} value={s}>
                {s.toUpperCase()}
              </option>
            ))}
          </select>

          <input
            className="w-72 rounded-md border bg-white px-3 py-2 text-sm outline-none focus:ring-2"
            placeholder="Search vendor / bank / amount / id…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      {notice ? (
        <div className="rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700">
          {notice}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="min-w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr className="text-left">
              <th className="px-4 py-3">Requested</th>
              <th className="px-4 py-3">Vendor</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Bank</th>
              <th className="px-4 py-3">Actions</th>
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
                  No payout requests found.
                </td>
              </tr>
            ) : (
              filtered.map((p) => {
                const v = p.vendors
                const bankOk = !!v?.bank_code && !!v?.account_number && !!v?.account_name

                return (
                  <tr key={p.id} className="border-b last:border-b-0">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {p.requested_at ? new Date(p.requested_at).toLocaleString() : '—'}
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-medium">{v?.business_name ?? '—'}</div>
                      <div className="text-xs opacity-60 font-mono">{p.vendor_id.slice(0, 8)}</div>
                    </td>

                    <td className="px-4 py-3">₦{Number(p.amount ?? 0).toLocaleString()}</td>

                    <td className="px-4 py-3">
                      <div className="inline-flex rounded-md border px-2 py-1 text-xs bg-white">{p.status}</div>
                      {p.status === 'rejected' && p.rejection_reason ? (
                        <div className="mt-1 text-xs text-red-700">{p.rejection_reason}</div>
                      ) : null}
                    </td>

                    <td className="px-4 py-3">
                      <div className="text-xs">
                        {(v?.bank_name ?? '—') + (v?.account_number ? ` • ${v.account_number}` : '')}
                      </div>
                      <div className="text-xs opacity-60">{v?.account_name ?? '—'}</div>

                      {!bankOk ? (
                        <div className="mt-1 text-[11px] text-amber-700">
                          Missing:{' '}
                          {!v?.bank_code ? 'bank_code ' : ''}
                          {!v?.account_number ? 'account_number ' : ''}
                          {!v?.account_name ? 'account_name' : ''}
                        </div>
                      ) : null}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => approve(p.id)}
                          disabled={p.status !== 'pending'}
                          className="rounded-md border bg-white px-3 py-2 text-xs hover:bg-gray-50 disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => reject(p.id)}
                          disabled={p.status === 'paid'}
                          className="rounded-md border bg-white px-3 py-2 text-xs hover:bg-gray-50 disabled:opacity-50"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => markPaid(p.id)}
                          disabled={p.status !== 'approved'}
                          className="rounded-md bg-black text-white px-3 py-2 text-xs disabled:opacity-50"
                        >
                          Mark paid
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="text-xs opacity-60">
        “Mark paid” triggers <code>/api/paystack/transfer</code> (Paystack bank transfer) then marks payout paid + creates wallet transactions.
      </div>
    </div>
  )
}