'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

type VendorRow = {
  id: string
  business_name: string | null
  bank_name: string | null
  bank_code: string | null
  account_number: string | null
  account_name: string | null
  paystack_recipient_code: string | null
}

export default function VendorProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const [vendor, setVendor] = useState<VendorRow | null>(null)

  const [businessName, setBusinessName] = useState('')
  const [bankName, setBankName] = useState('')
  const [bankCode, setBankCode] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountName, setAccountName] = useState('')

  const missing = useMemo(() => {
    const m: string[] = []
    if (!bankCode.trim()) m.push('bank_code')
    if (!accountNumber.trim()) m.push('account_number')
    if (!accountName.trim()) m.push('account_name')
    return m
  }, [bankCode, accountNumber, accountName])

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

      const uid = userData.user?.id
      if (!uid) {
        if (mounted) {
          setError('Not logged in')
          setLoading(false)
        }
        return
      }

      const { data, error } = await supabase
        .from('vendors')
        .select('id,business_name,bank_name,bank_code,account_number,account_name,paystack_recipient_code')
        .eq('id', uid)
        .maybeSingle()

      if (!mounted) return

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      if (!data) {
        setError('Vendor profile not found.')
        setLoading(false)
        return
      }

      setVendor(data as VendorRow)

      setBusinessName(data.business_name ?? '')
      setBankName(data.bank_name ?? '')
      setBankCode(data.bank_code ?? '')
      setAccountNumber(data.account_number ?? '')
      setAccountName(data.account_name ?? '')

      setLoading(false)
    }

    load()

    return () => {
      mounted = false
    }
  }, [])

  const save = async () => {
    if (!vendor) return
    setSaving(true)
    setError(null)
    setNotice(null)

    try {
      // If bank details changed, recipient code should be reset so admin payout recreates it safely.
      const bankChanged =
        (vendor.bank_code ?? '') !== bankCode.trim() ||
        (vendor.account_number ?? '') !== accountNumber.trim() ||
        (vendor.account_name ?? '') !== accountName.trim()

      const patch: Partial<VendorRow> = {
        business_name: businessName.trim() || null,
        bank_name: bankName.trim() || null,
        bank_code: bankCode.trim() || null,
        account_number: accountNumber.trim() || null,
        account_name: accountName.trim() || null,
      }

      if (bankChanged) {
        patch.paystack_recipient_code = null
      }

      const { data, error } = await supabase
        .from('vendors')
        .update(patch)
        .eq('id', vendor.id)
        .select('id,business_name,bank_name,bank_code,account_number,account_name,paystack_recipient_code')
        .maybeSingle()

      if (error) throw new Error(error.message)

      setVendor(data as VendorRow)
      setNotice(bankChanged ? 'Saved. (Recipient will be recreated on next payout)' : 'Saved.')
    } catch (e: any) {
      setError(e?.message ?? 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Vendor Profile</h1>
        <p className="text-sm opacity-70">Update business + bank details for payouts.</p>
      </div>

      {loading ? (
        <div className="rounded-xl border bg-white p-4 text-sm opacity-70">Loading…</div>
      ) : null}

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

      {!loading && vendor ? (
        <div className="rounded-xl border bg-white p-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Business name" value={businessName} onChange={setBusinessName} />
            <Field label="Bank name" value={bankName} onChange={setBankName} />
            <Field label="Bank code (Paystack)" value={bankCode} onChange={setBankCode} />
            <Field label="Account number" value={accountNumber} onChange={setAccountNumber} />
            <Field label="Account name" value={accountName} onChange={setAccountName} />
          </div>

          <div className="text-xs opacity-70">
            Recipient code: <span className="font-mono">{vendor.paystack_recipient_code ?? '—'}</span>
          </div>

          {missing.length ? (
            <div className="text-xs text-amber-700">
              Missing: {missing.join(', ')} (Admin “Mark paid” will be disabled until these are filled)
            </div>
          ) : null}

          <button
            onClick={save}
            disabled={saving}
            className="rounded-md bg-black text-white px-4 py-2 text-sm disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      ) : null}
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <label className="space-y-1">
      <div className="text-sm font-medium">{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border bg-white px-3 py-2 text-sm"
      />
    </label>
  )
}