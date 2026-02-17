'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function RpcTestPage() {
  const [orderId, setOrderId] = useState('')
  const [vehicleId, setVehicleId] = useState('')
  const [distanceKm, setDistanceKm] = useState('2.5')
  const [out, setOut] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  async function run() {
    setLoading(true)
    setOut(null)

    const { data, error } = await supabase.rpc('accept_order_with_pricing', {
      p_order_id: orderId.trim(),
      p_vehicle_id: vehicleId.trim(),
      p_distance_km: Number(distanceKm),
    })

    setOut({ data, error })
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">RPC Test</h1>
      <p className="text-sm text-slate-600">
        Internal tool: accept order with pricing snapshots.
      </p>

      <div className="rounded-2xl border bg-white p-4 space-y-3 max-w-xl">
        <div>
          <label className="text-xs font-medium text-slate-600">Order ID (pending)</label>
          <input
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm font-mono"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Vehicle ID</label>
          <input
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm font-mono"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Distance (km)</label>
          <input
            value={distanceKm}
            onChange={(e) => setDistanceKm(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            inputMode="decimal"
          />
        </div>

        <button
          disabled={loading}
          onClick={run}
          className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? 'Running…' : 'Run RPC'}
        </button>
      </div>

      {out ? (
        <pre className="rounded-2xl border bg-white p-4 text-xs overflow-auto">
          {JSON.stringify(out, null, 2)}
        </pre>
      ) : null}
    </div>
  )
}
