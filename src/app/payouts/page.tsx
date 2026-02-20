'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

type VendorMini = {
  id?: string | null
  business_name: string | null
  bank_name: string | null
  bank_code?: string | null
  account_number: string | null
  account_name: string | null
  paystack_recipient_code?: string | null
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
  vendors?: VendorMini[] | null
}

const STATUS = ['all', 'pending', 'approved', 'rejected', 'paid', 'cancelled'] as const

function missingBankFields(v: VendorMini | null) {
  const missing: string[] = []
  if (!v?.bank_code) missing.push('bank_code')
  if (!v?.account_number) missing.push('account_number')
  if (!v?.account_name) missing.push('account_name')
  return missing
}

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
      const v = r.vendors?.[0] ?? null
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

  useEffect(() => {
    let mounted = true

    const load = async () => {
      setLoading(true)
      setError(null)

      try {
        const res = await fetch('/api/admin/payouts?limit=200', { cache: 'no-store' })
        const json = await res.json().catch(() => ({}))

        if (!res.ok) throw new Error(json?.error || `Failed (${res.status})`)

        setRows((json?.data ?? []) as unknown as PayoutRow[])
      } catch (e: any) {
        setError(e?.message ?? 'Failed to load payouts')
        setRows([])
      } finally {
        setLoading(false)
      }
    }

    load()

    const ch = supabase
      .channel('admin-payouts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vendor_payout_requests' }, load)
      .subscribe()

    return () => {
      mounted = false
      supabase.removeChannel(ch)
    }
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

  /**
   * Mark paid = Paystack transfer (server) + mark paid in DB
   * Assumes you already built /api/paystack/transfer
   */
  const markPaid = async (id: string) => {
    const ok = window.confirm(
      'This will initiate a Paystack transfer to the vendor bank account and then mark this payout as PAID. Continue?'
    )
    if (!ok) return

    setError(null)
    setNotice(null)

    try {
      const res = await fetch('/api/paystack/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: id }),
      })

      const json = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(json?.error || `Transfer failed (${res.status})`)
      }

      const code = json?.transfer?.transfer_code ?? json?.transfer?.reference ?? ''
      setNotice(
        code
          ? `Transfer started ✅ (${code}). Payout marked as PAID.`
          : 'Transfer started ✅. Payout marked as PAID.'
      )
    } catch (e: any) {
      setError(e?.message ?? 'Transfer failed')
    }
  }

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setNotice('Copied ✅')
      setTimeout(() => setNotice(null), 1200)
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Payouts</h1>
          <p className="text-sm opacity-70">Approve, reject, and pay vendors (Paystack transfer).</p>
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
                const v = p.vendors?.[0] ?? null

                // Join can fail if vendor_id doesn't match vendors.id
                const joinFailed = !p.vendors || p.vendors.length === 0

                const missing = joinFailed ? ['vendor join failed'] : missingBankFields(v)
                const bankOk = missing.length === 0

                const disableReason = joinFailed
                  ? 'Vendor join failed (vendor_id does not match vendors.id)'
                  : missing.length
                  ? `Missing: ${missing.join(', ')}`
                  : ''

                return (
                  <tr key={p.id} className="border-b last:border-b-0">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {p.requested_at ? new Date(p.requested_at).toLocaleString() : '—'}
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-medium">{v?.business_name ?? '—'}</div>

                      <div className="mt-1 flex items-center gap-2">
                        <div className="text-xs opacity-60 font-mono">{p.vendor_id.slice(0, 8)}</div>
                        <button
                          onClick={() => copy(p.vendor_id)}
                          className="rounded-md border bg-white px-2 py-1 text-[11px] hover:bg-gray-50"
                          title="Copy vendor_id"
                        >
                          Copy
                        </button>
                      </div>

                      {joinFailed ? (
                        <div className="mt-2 text-[11px] text-amber-700">
                          Vendor join failed. This usually means{" "}
                          <span className="font-mono">vendor_payout_requests.vendor_id</span> is not equal to{" "}
                          <span className="font-mono">vendors.id</span>.
                        </div>
                      ) : null}
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
                        <div className="mt-1 text-[11px] text-amber-700">{disableReason}</div>
                      ) : (
                        <div className="mt-1 text-[11px] text-emerald-700">
                          Ready ✅ (bank_code: <span className="font-mono">{v?.bank_code}</span>)
                        </div>
                      )}
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
                          disabled={p.status !== 'approved' || !bankOk}
                          className="rounded-md bg-black text-white px-3 py-2 text-xs disabled:opacity-50"
                          title={p.status !== 'approved' ? 'Must be approved first' : disableReason}
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
        If “Vendor join failed”, confirm your DB:{" "}
        <code>vendor_payout_requests.vendor_id</code> must match <code>vendors.id</code>.
        If it doesn’t, we’ll change the join key (or change what you store in payout requests).
      </div>
    </div>
  )
}