'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

type PricingRow = {
  id: string
  is_active: boolean
  gas_price_per_kg: number
  platform_fee_per_kg: number
  base_delivery_fee: number
  per_km_rate: number
  updated_at: string
}

type FormState = {
  gas_price_per_kg: string
  platform_fee_per_kg: string
  base_delivery_fee: string
  per_km_rate: string
}

export default function PricingSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [row, setRow] = useState<PricingRow | null>(null)

  const [form, setForm] = useState<FormState>({
    gas_price_per_kg: '',
    platform_fee_per_kg: '',
    base_delivery_fee: '',
    per_km_rate: '',
  })

  async function load() {
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('pricing_settings')
        .select('id,is_active,gas_price_per_kg,platform_fee_per_kg,base_delivery_fee,per_km_rate,updated_at')
        .eq('is_active', true)
        .maybeSingle()

      if (error) throw error
      if (!data) throw new Error('No active pricing row found. Please seed pricing_settings.')

      const r = data as PricingRow
      setRow(r)
      setForm({
        gas_price_per_kg: String(r.gas_price_per_kg),
        platform_fee_per_kg: String(r.platform_fee_per_kg),
        base_delivery_fee: String(r.base_delivery_fee),
        per_km_rate: String(r.per_km_rate),
      })
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load pricing settings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function toInt(name: keyof FormState) {
    const raw = form[name].trim()
    if (!raw) return null
    const n = Number(raw)
    if (!Number.isFinite(n) || !Number.isInteger(n)) return null
    if (n < 0) return null
    return n
  }

  async function save() {
    if (!row) return

    setSaving(true)
    setError(null)

    try {
      const gas = toInt('gas_price_per_kg')
      const platform = toInt('platform_fee_per_kg')
      const base = toInt('base_delivery_fee')
      const perKm = toInt('per_km_rate')

      if (gas === null) throw new Error('Gas price per kg must be a non-negative integer.')
      if (platform === null) throw new Error('Platform fee per kg must be a non-negative integer.')
      if (base === null) throw new Error('Base delivery fee must be a non-negative integer.')
      if (perKm === null) throw new Error('Per-km rate must be a non-negative integer.')

      const { error } = await supabase
        .from('pricing_settings')
        .update({
          gas_price_per_kg: gas,
          platform_fee_per_kg: platform,
          base_delivery_fee: base,
          per_km_rate: perKm,
        })
        .eq('id', row.id)

      if (error) throw error

      await load()
    } catch (e: any) {
      setError(e?.message ?? 'Failed to save pricing')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Pricing Settings</h1>
        <p className="text-sm text-slate-600">
          Nationwide pricing. Vendor pricing is controlled only by admin.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
      ) : null}

      {loading ? (
        <div className="rounded-xl border p-6 text-sm text-slate-600">Loading pricing…</div>
      ) : row ? (
        <div className="rounded-2xl border bg-white p-5 space-y-4">
          <div className="text-xs text-slate-500">
            Active row updated: <span className="font-mono">{new Date(row.updated_at).toLocaleString()}</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-slate-600">Gas price per kg (₦)</label>
              <input
                value={form.gas_price_per_kg}
                onChange={(e) => setForm((p) => ({ ...p, gas_price_per_kg: e.target.value }))}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                inputMode="numeric"
              />
              <div className="mt-1 text-xs text-slate-500">Example: 1300</div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600">Platform fee per kg (₦)</label>
              <input
                value={form.platform_fee_per_kg}
                onChange={(e) => setForm((p) => ({ ...p, platform_fee_per_kg: e.target.value }))}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                inputMode="numeric"
              />
              <div className="mt-1 text-xs text-slate-500">Example: 50</div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600">Base delivery fee (₦)</label>
              <input
                value={form.base_delivery_fee}
                onChange={(e) => setForm((p) => ({ ...p, base_delivery_fee: e.target.value }))}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                inputMode="numeric"
              />
              <div className="mt-1 text-xs text-slate-500">Example: 500</div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600">Per km rate (₦/km)</label>
              <input
                value={form.per_km_rate}
                onChange={(e) => setForm((p) => ({ ...p, per_km_rate: e.target.value }))}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                inputMode="numeric"
              />
              <div className="mt-1 text-xs text-slate-500">Example: 150</div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={load}
              disabled={saving}
              className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-60"
            >
              Reload
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save pricing'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
