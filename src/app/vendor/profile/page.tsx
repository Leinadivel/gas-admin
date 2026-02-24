'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

type VendorRow = {
  id: string
  profile_id: string
  business_name: string | null
  bank_name: string | null
  bank_code: string | null
  account_number: string | null
  account_name: string | null
  paystack_recipient_code: string | null
}

type PaystackBank = {
  name: string
  code: string
  active?: boolean
}

export default function VendorProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [resolving, setResolving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const [vendor, setVendor] = useState<VendorRow | null>(null)

  const [businessName, setBusinessName] = useState('')
  const [bankName, setBankName] = useState('')
  const [bankCode, setBankCode] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountName, setAccountName] = useState('')

  // Paystack banks UI
  const [banks, setBanks] = useState<PaystackBank[]>([])
  const [banksLoaded, setBanksLoaded] = useState(false)
  const [bankOpen, setBankOpen] = useState(false)
  const [bankQuery, setBankQuery] = useState('')

  const missing = useMemo(() => {
    const m: string[] = []
    if (!bankCode.trim()) m.push('bank_code')
    if (!accountNumber.trim()) m.push('account_number')
    if (!accountName.trim()) m.push('account_name')
    return m
  }, [bankCode, accountNumber, accountName])

  const filteredBanks = useMemo(() => {
    const q = bankQuery.trim().toLowerCase()
    const list = banks.filter(b => (b.active ?? true) !== false)
    if (!q) return list.slice(0, 25)
    return list
      .filter(b => b.name.toLowerCase().includes(q))
      .slice(0, 25)
  }, [banks, bankQuery])

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
        .select('id,profile_id,business_name,bank_name,bank_code,account_number,account_name,paystack_recipient_code')
        .eq('profile_id', uid)
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

  // ✅ Fetch banks from backend (server uses Paystack secret)
  const loadBanks = async () => {
    if (banksLoaded) return
    try {
      setError(null)
      const res = await fetch('/api/paystack/banks', { method: 'GET' })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed to load banks')
      setBanks(Array.isArray(json?.banks) ? json.banks : [])
      setBanksLoaded(true)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load banks')
    }
  }

  // ✅ Resolve account name (server-side)
  const resolveAccountName = async (bank_code: string, account_number: string) => {
    if (!bank_code || account_number.length !== 10) return
    setResolving(true)
    setError(null)
    setNotice(null)

    try {
      const res = await fetch('/api/paystack/resolve-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bank_code, account_number }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Could not resolve account')

      const name = String(json?.account_name || '').trim()
      if (!name) throw new Error('Account name not returned')
      setAccountName(name)
      setNotice('Account verified ✅')
    } catch (e: any) {
      // Don’t block saving, but show error
      setAccountName('')
      setError(e?.message ?? 'Account resolution failed')
    } finally {
      setResolving(false)
    }
  }

  // Auto resolve when bankCode + 10-digit accountNumber ready
  useEffect(() => {
    const code = bankCode.trim()
    const acc = accountNumber.replace(/\D/g, '').slice(0, 10)

    // keep state sanitized
    if (acc !== accountNumber) setAccountNumber(acc)

    if (!code || acc.length !== 10) return
    // Only resolve if user hasn’t manually typed accountName or it’s empty
    resolveAccountName(code, acc)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bankCode])

  const save = async () => {
    if (!vendor) return
    setSaving(true)
    setError(null)
    setNotice(null)

    try {
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

      if (bankChanged) patch.paystack_recipient_code = null

      const { data, error } = await supabase
        .from('vendors')
        .update(patch)
        .eq('id', vendor.id)
        .select('id,profile_id,business_name,bank_name,bank_code,account_number,account_name,paystack_recipient_code')
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

  const onPickBank = (b: PaystackBank) => {
    setBankName(b.name)
    setBankCode(b.code)
    setBankOpen(false)
    setBankQuery('')
    setAccountName('') // will be resolved again
    // Resolve when account number is ready (10 digits)
    const acc = accountNumber.trim()
    if (acc.length === 10) resolveAccountName(b.code, acc)
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

            {/* ✅ Bank dropdown */}
            <div className="space-y-1 relative">
              <div className="text-sm font-medium">Bank name</div>
              <input
                value={bankName}
                onFocus={async () => {
                  await loadBanks()
                  setBankOpen(true)
                }}
                onChange={(e) => {
                  setBankName(e.target.value)
                  setBankQuery(e.target.value)
                  setBankOpen(true)
                }}
                placeholder="Select bank"
                className="w-full rounded-md border bg-white px-3 py-2 text-sm"
              />

              {bankOpen ? (
                <div className="absolute z-20 mt-1 w-full rounded-md border bg-white shadow-sm max-h-64 overflow-auto">
                  <div className="px-3 py-2 text-xs opacity-70 border-b">
                    {banksLoaded ? 'Select a bank' : 'Loading banks…'}
                  </div>

                  {filteredBanks.map((b) => (
                    <button
                      key={b.code}
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                      onClick={() => onPickBank(b)}
                    >
                      {b.name}
                    </button>
                  ))}

                  {!filteredBanks.length ? (
                    <div className="px-3 py-3 text-sm opacity-70">No banks found</div>
                  ) : null}

                  <div className="px-3 py-2 border-t">
                    <button
                      type="button"
                      className="text-xs underline opacity-70"
                      onClick={() => setBankOpen(false)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            <Field label="Bank code (Paystack)" value={bankCode} onChange={setBankCode} disabled />

            <Field
              label="Account number"
              value={accountNumber}
              onChange={(v) => {
                const clean = v.replace(/\D/g, '').slice(0, 10)
                setAccountNumber(clean)
                setAccountName('')
                setNotice(null)
                if (bankCode.trim() && clean.length === 10) resolveAccountName(bankCode.trim(), clean)
              }}
            />

            <Field
              label="Account name"
              value={accountName}
              onChange={setAccountName}
              disabled
              rightHint={resolving ? 'Verifying…' : ''}
            />
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
  disabled,
  rightHint,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  disabled?: boolean
  rightHint?: string
}) {
  return (
    <label className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">{label}</div>
        {rightHint ? <div className="text-xs opacity-70">{rightHint}</div> : null}
      </div>
      <input
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border bg-white px-3 py-2 text-sm disabled:opacity-60"
      />
    </label>
  )
}