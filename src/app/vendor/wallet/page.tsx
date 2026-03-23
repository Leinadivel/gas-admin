'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import {
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Wallet,
  TrendingUp,
  Landmark,
} from 'lucide-react'

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-blue-100 p-3 text-blue-600">
            <Wallet size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Wallet</h1>
            <p className="text-sm text-gray-500">
              {vendor?.business_name ?? 'Vendor'} earnings overview
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setError(null)
            setNotice(null)
            setWithdrawOpen(true)
          }}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
        >
          Withdraw
        </button>
      </div>

      {/* Alerts */}
      {notice && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {notice}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Wallet size={16} />}
          label="Wallet balance"
          value={loading ? '—' : `₦${wallet.toLocaleString()}`}
          accent="blue"
        />
        <StatCard
          icon={<Landmark size={16} />}
          label="Balance"
          value={loading ? '—' : `₦${balance.toLocaleString()}`}
        />
        <StatCard
          icon={<ArrowUpRight size={16} />}
          label="Credits"
          value={loading ? '—' : `₦${Math.round(totals.credit).toLocaleString()}`}
          accent="green"
        />
        <StatCard
          icon={<ArrowDownRight size={16} />}
          label="Debits"
          value={loading ? '—' : `₦${Math.round(totals.debit).toLocaleString()}`}
          accent="orange"
        />
      </div>

      {/* Withdrawals */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b px-4 py-4">
          <h2 className="text-sm font-semibold text-gray-900">Withdrawal requests</h2>
          <p className="text-xs text-gray-500">Track payout approvals and payments</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Requested</th>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Amount</th>
                <th className="px-4 py-3 text-left">Reviewed</th>
                <th className="px-4 py-3 text-left">Reason</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : payouts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                    No withdrawal requests yet
                  </td>
                </tr>
              ) : (
                payouts.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {p.requested_at ? new Date(p.requested_at).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{p.id.slice(0, 8)}</td>
                    <td className="px-4 py-3 capitalize">{p.status}</td>
                    <td className="px-4 py-3 font-medium">
                      ₦{Number(p.amount ?? 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
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
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b px-4 py-4">
          <h2 className="text-sm font-semibold text-gray-900">Transactions</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Amount</th>
                <th className="px-4 py-3 text-left">Order</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : txs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                    No transactions yet
                  </td>
                </tr>
              ) : (
                txs.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {t.created_at ? new Date(t.created_at).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{t.id.slice(0, 8)}</td>
                    <td className="px-4 py-3 capitalize">{t.type ?? '—'}</td>
                    <td className="px-4 py-3">{t.status ?? '—'}</td>
                    <td className="px-4 py-3 font-medium">
                      ₦{Number(t.amount ?? 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      {t.order_id ? (
                        <Link
                          href={`/vendor/bookings/${t.order_id}`}
                          className="text-blue-600 hover:underline"
                        >
                          View
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
      </div>

      {/* Modal */}
      {withdrawOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-lg">
            <h2 className="text-lg font-semibold">Withdraw funds</h2>
            <p className="text-sm text-gray-500 mt-1">
              Available: ₦{wallet.toLocaleString()}
            </p>

            <input
              className="mt-4 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              placeholder="Enter amount"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
            />

            <div className="mt-4 flex gap-2">
              <button
                onClick={submitWithdraw}
                disabled={withdrawing}
                className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {withdrawing ? 'Submitting…' : 'Submit'}
              </button>
              <button
                onClick={() => setWithdrawOpen(false)}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: string
  accent?: 'blue' | 'green' | 'orange'
}) {
  const accentStyles = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span className={`rounded-lg p-2 ${accent ? accentStyles[accent] : 'bg-gray-100'}`}>
          {icon}
        </span>
        {label}
      </div>
      <div className="mt-3 text-2xl font-semibold text-gray-900">{value}</div>
    </div>
  )
}