'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

type OrderMini = {
  id: string
  status: string
  created_at: string | null
  location: string | null
}

type TxMini = {
  id: string
  type: string
  amount: number
  created_at: string
  order_id: string | null
  status: string | null
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [totalOrders, setTotalOrders] = useState<number>(0)
  const [pendingOrders, setPendingOrders] = useState<number>(0)
  const [activeVendors, setActiveVendors] = useState<number>(0)
  const [totalTransactions, setTotalTransactions] = useState<number>(0)

  const [recentOrders, setRecentOrders] = useState<OrderMini[]>([])
  const [recentTx, setRecentTx] = useState<TxMini[]>([])

  const [orderStatusCounts, setOrderStatusCounts] = useState<Record<string, number>>({})
  const [txTypeCounts, setTxTypeCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    let mounted = true

    const load = async () => {
      setLoading(true)
      setError(null)

      const [ordersRes, txRes, vendorsRes, recentOrdersRes, recentTxRes] =
        await Promise.all([
          supabase.from('orders').select('status').limit(5000),
          supabase.from('transactions').select('id,type').limit(5000),
          supabase.from('vendors').select('is_online').limit(5000),

          supabase
            .from('orders')
            .select('id,status,created_at,location')
            .order('created_at', { ascending: false })
            .limit(5),

          supabase
            .from('transactions')
            .select('id,type,amount,created_at,order_id,status')
            .order('created_at', { ascending: false })
            .limit(5),
        ])

      if (!mounted) return

      if (ordersRes.error) setError(ordersRes.error.message)
      if (txRes.error) setError((prev) => prev ?? txRes.error.message)
      if (vendorsRes.error) setError((prev) => prev ?? vendorsRes.error.message)
      if (recentOrdersRes.error) setError((prev) => prev ?? recentOrdersRes.error.message)
      if (recentTxRes.error) setError((prev) => prev ?? recentTxRes.error.message)

      // Orders counts
      const orders = (ordersRes.data ?? []) as { status: string }[]
      setTotalOrders(orders.length)
      setPendingOrders(orders.filter((o) => o.status === 'pending').length)

      const statusMap: Record<string, number> = {}
      for (const o of orders) statusMap[o.status] = (statusMap[o.status] ?? 0) + 1
      setOrderStatusCounts(statusMap)

      // Vendors online
      const vendors = (vendorsRes.data ?? []) as { is_online: boolean }[]
      setActiveVendors(vendors.filter((v) => v.is_online).length)

      // Transactions counts
      const txs = (txRes.data ?? []) as { id: string; type: string }[]
      setTotalTransactions(txs.length)

      const typeMap: Record<string, number> = {}
      for (const t of txs) typeMap[t.type] = (typeMap[t.type] ?? 0) + 1
      setTxTypeCounts(typeMap)

      setRecentOrders((recentOrdersRes.data ?? []) as OrderMini[])
      setRecentTx((recentTxRes.data ?? []) as TxMini[])

      setLoading(false)
    }

    load()

    const ch = supabase
      .channel('admin-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vendors' }, load)
      .subscribe()

    return () => {
      mounted = false
      supabase.removeChannel(ch)
    }
  }, [])

  const statusSeries = useMemo(() => toSeries(orderStatusCounts, 8), [orderStatusCounts])
  const txSeries = useMemo(() => toSeries(txTypeCounts, 8), [txTypeCounts])

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm opacity-70">Live overview (auto-refresh).</p>
        </div>

        <div className="text-xs opacity-60">{loading ? 'Refreshing…' : 'Up to date'}</div>
      </div>

      {error ? (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Orders" value={loading ? '…' : String(totalOrders)} />
        <StatCard
          label="Pending Orders"
          value={loading ? '…' : String(pendingOrders)}
          hint="status = pending"
        />
        <StatCard
          label="Active Vendors"
          value={loading ? '…' : String(activeVendors)}
          hint="is_online = true"
        />
        <StatCard label="Transactions" value={loading ? '…' : String(totalTransactions)} />
      </div>

      {/* Graphs */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Orders by status"
          subtitle="Distribution of order statuses"
          series={statusSeries}
        />
        <ChartCard
          title="Transactions by type"
          subtitle="Distribution of transaction types"
          series={txSeries}
        />
      </div>

      {/* Recent activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Recent Orders</div>
            <Link href="/orders" className="text-xs underline underline-offset-2">
              View all
            </Link>
          </div>

          <div className="mt-3 divide-y">
            {recentOrders.length === 0 ? (
              <div className="py-6 text-sm opacity-70">No recent orders.</div>
            ) : (
              recentOrders.map((o) => (
                <Link
                  key={o.id}
                  href={`/orders/${o.id}`}
                  className="block py-3 hover:bg-gray-50 -mx-2 px-2 rounded-md"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-mono text-xs opacity-70 truncate">{o.id}</div>
                    <div className="text-xs">{o.status}</div>
                  </div>
                  <div className="mt-1 text-xs opacity-60 truncate">{o.location ?? '—'}</div>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Recent Transactions</div>
            <Link href="/transactions" className="text-xs underline underline-offset-2">
              View all
            </Link>
          </div>

          <div className="mt-3 divide-y">
            {recentTx.length === 0 ? (
              <div className="py-6 text-sm opacity-70">No recent transactions.</div>
            ) : (
              recentTx.map((t) => (
                <div key={t.id} className="py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-mono text-xs opacity-70 truncate">{t.id}</div>
                    <div className="text-xs">
                      {t.type} • {String(t.amount)}
                    </div>
                  </div>

                  <div className="mt-1 flex items-center justify-between text-xs opacity-60">
                    <div>{t.status ?? '—'}</div>
                    {t.order_id ? (
                      <Link
                        href={`/orders/${t.order_id}`}
                        className="underline underline-offset-2"
                      >
                        order
                      </Link>
                    ) : (
                      <span>—</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
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

function ChartCard({
  title,
  subtitle,
  series,
}: {
  title: string
  subtitle: string
  series: { label: string; value: number }[]
}) {
  const max = Math.max(1, ...series.map((s) => s.value))

  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium">{title}</div>
          <div className="text-xs opacity-60">{subtitle}</div>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {series.length === 0 ? (
          <div className="text-sm opacity-70">No data yet.</div>
        ) : (
          series.map((s) => (
            <div key={s.label} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="opacity-70">{s.label}</div>
                <div className="font-mono opacity-70">{s.value}</div>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-2 rounded-full bg-gray-900"
                  style={{ width: `${Math.round((s.value / max) * 100)}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// Convert a map into a top-N series sorted desc
function toSeries(map: Record<string, number>, limit: number) {
  return Object.entries(map)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)
}
