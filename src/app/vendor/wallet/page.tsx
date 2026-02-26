'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

type VendorRow = {
  id: string
  business_name: string | null
  wallet_balance: number | null
  balance: number | null
  profile_id?: string | null
  user_id?: string | null
  created_at?: string | null
}

type TxRow = {
  id: string
  vendor_id: string
  order_id: string | null
  amount: number
  type: string | null
  status: string | null
  created_at: string
}

type PayoutRow = {
  id: string
  vendor_id: string
  amount: number
  status: string
  requested_at: string
  reviewed_at: string | null
  rejection_reason: string | null
  paystack_reference: string | null
}

export default function VendorWalletPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [vendor, setVendor] = useState<VendorRow | null>(null)
  const [txs, setTxs] = useState<TxRow[]>([])
  const [payouts, setPayouts] = useState<PayoutRow[]>([])

  // withdraw modal
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawing, setWithdrawing] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const totals = useMemo(() => {
    let credit = 0
    let debit = 0
    for (const t of txs) {
      const amt = Number(t.amount ?? 0)
      const typ = (t.type ?? '').toLowerCase()
      if (typ.includes('debit') || typ.includes('payout') || typ.includes('withdraw')) debit += amt
      else credit += amt
    }
    return { credit, debit }
  }, [txs])

  const wallet = Number(vendor?.wallet_balance ?? 0)
  const balance = Number(vendor?.balance ?? 0)

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

      // ✅ SAFE vendor lookup (NO maybeSingle)
      const { data: vendorRows, error: vendorErr } = await supabase
        .from('vendors')
        .select('id,business_name,wallet_balance,balance,profile_id,user_id,created_at')
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

      // transactions + payout requests
      const [txRes, payoutRes] = await Promise.all([
        supabase
          .from('transactions')
          .select('id,vendor_id,order_id,amount,type,status,created_at')
          .eq('vendor_id', vendorRow.id)
          .order('created_at', { ascending: false })
          .limit(200),

        supabase
          .from('vendor_payout_requests')
          .select('id,vendor_id,amount,status,requested_at,reviewed_at,rejection_reason,paystack_reference')
          .eq('vendor_id', vendorRow.id)
          .order('requested_at', { ascending: false })
          .limit(200),
      ])

      if (!mounted) return

      if (txRes.error) {
        setError((p) => p ?? txRes.error!.message)
        setTxs([])
      } else {
        setTxs((txRes.data ?? []) as TxRow[])
      }

      if (payoutRes.error) {
        setError((p) => p ?? payoutRes.error!.message)
        setPayouts([])
      } else {
        setPayouts((payoutRes.data ?? []) as PayoutRow[])
      }

      setLoading(false)
    }

    load()

    const ch = supabase
      .channel('vendor-wallet')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vendors' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vendor_payout_requests' }, load)
      .subscribe()

    return () => {
      mounted = false
      supabase.removeChannel(ch)
    }
  }, [])

  const submitWithdraw = async () => {
    setError(null)
    setNotice(null)

    if (!vendor?.id) {
      setError('Vendor not loaded yet.')
      return
    }

    const amt = Number(withdrawAmount)
    if (!Number.isFinite(amt) || amt <= 0) {
      setError('Enter a valid amount.')
      return
    }

    if (amt > wallet) {
      setError(`Insufficient wallet balance. Available: ₦${wallet.toLocaleString()}`)
      return
    }

    setWithdrawing(true)

    const { error: insErr } = await supabase.from('vendor_payout_requests').insert({
      vendor_id: vendor.id,
      amount: amt,
      status: 'pending',
    })

    setWithdrawing(false)

    if (insErr) {
      setError(insErr.message)
      return
    }

    setWithdrawOpen(false)
    setWithdrawAmount('')
    setNotice('Withdrawal request submitted (pending admin approval).')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Wallet</h1>
          <p className="text-sm opacity-70">
            {vendor?.business_name ?? 'Vendor'} earnings and transactions
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setError(null)
            setNotice(null)
            setWithdrawOpen(true)
          }}
          disabled={loading}
          className="rounded-md bg-black text-white px-3 py-2 text-sm disabled:opacity-60"
        >
          Withdraw
        </button>
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Wallet balance"
          value={loading ? '…' : `₦${wallet.toLocaleString()}`}
          hint="Withdraw uses wallet_balance"
        />
        <StatCard label="Balance" value={loading ? '…' : `₦${balance.toLocaleString()}`} hint="Optional/internal" />
        <StatCard label="Credits (sum)" value={loading ? '…' : `₦${Math.round(totals.credit).toLocaleString()}`} />
        <StatCard label="Debits (sum)" value={loading ? '…' : `₦${Math.round(totals.debit).toLocaleString()}`} />
      </div>

      {/* Payout requests */}
      <div className="rounded-xl border bg-white">
        <div className="border-b px-4 py-3">
          <div className="text-sm font-medium">Withdrawal requests</div>
          <div className="text-xs opacity-60">Pending → approved/rejected → paid (later Paystack).</div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b bg-gray-50">
              <tr className="text-left">
                <th className="px-4 py-3">Requested</th>
                <th className="px-4 py-3">Request ID</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Reviewed</th>
                <th className="px-4 py-3">Reason</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-6 opacity-70" colSpan={6}>
                    Loading…
                  </td>
                </tr>
              ) : payouts.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 opacity-70" colSpan={6}>
                    No withdrawal requests yet.
                  </td>
                </tr>
              ) : (
                payouts.map((p) => (
                  <tr key={p.id} className="border-b last:border-b-0">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {p.requested_at ? new Date(p.requested_at).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3 font-mono">{p.id.slice(0, 8)}</td>
                    <td className="px-4 py-3">{p.status}</td>
                    <td className="px-4 py-3">₦{Number(p.amount ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {p.reviewed_at ? new Date(p.reviewed_at).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {p.status === 'rejected' ? p.rejection_reason ?? '—' : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transactions */}
      <div className="overflow-x-auto rounded-xl border bg-white">
        <div className="border-b px-4 py-3">
          <div className="text-sm font-medium">Transactions</div>
        </div>

        <table className="min-w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr className="text-left">
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Tx ID</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Order</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-6 opacity-70" colSpan={6}>
                  Loading…
                </td>
              </tr>
            ) : txs.length === 0 ? (
              <tr>
                <td className="px-4 py-6 opacity-70" colSpan={6}>
                  No transactions yet.
                </td>
              </tr>
            ) : (
              txs.map((t) => (
                <tr key={t.id} className="border-b last:border-b-0">
                  <td className="px-4 py-3 whitespace-nowrap">
                    {t.created_at ? new Date(t.created_at).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3 font-mono">{t.id.slice(0, 8)}</td>
                  <td className="px-4 py-3">{t.type ?? '—'}</td>
                  <td className="px-4 py-3">{t.status ?? '—'}</td>
                  <td className="px-4 py-3">₦{Number(t.amount ?? 0).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    {t.order_id ? (
                      <Link className="underline underline-offset-2" href={`/vendor/bookings/${t.order_id}`}>
                        view
                      </Link>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Withdraw modal */}
      {withdrawOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl border bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-semibold">Withdraw</div>
                <div className="text-xs opacity-60">Available: ₦{wallet.toLocaleString()}</div>
              </div>
              <button
                onClick={() => setWithdrawOpen(false)}
                className="rounded-md border px-2 py-1 text-sm hover:bg-gray-50"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-2">
              <label className="text-sm font-medium">Amount</label>
              <input
                className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2"
                inputMode="numeric"
                placeholder="e.g. 5000"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
              />
              <div className="text-xs opacity-60">
                This creates a payout request (admin will approve). Paystack transfer comes next.
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={submitWithdraw}
                disabled={withdrawing}
                className="rounded-md bg-black text-white px-4 py-2 text-sm disabled:opacity-60"
              >
                {withdrawing ? 'Submitting…' : 'Submit request'}
              </button>
              <button
                onClick={() => setWithdrawOpen(false)}
                className="rounded-md border bg-white px-4 py-2 text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="text-sm opacity-70">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      {hint ? <div className="mt-1 text-xs opacity-60">{hint}</div> : null}
    </div>
  )
}