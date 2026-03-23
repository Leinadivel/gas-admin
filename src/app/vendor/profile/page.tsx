'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import {
  BadgeCheck,
  Building2,
  CheckCircle2,
  CreditCard,
  Landmark,
  Loader2,
  ShieldCheck,
} from 'lucide-react'

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
    const list = banks.filter((b) => (b.active ?? true) !== false)
    if (!q) return list.slice(0, 25)
    return list.filter((b) => b.name.toLowerCase().includes(q)).slice(0, 25)
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
        .select(
          'id,profile_id,business_name,bank_name,bank_code,account_number,account_name,paystack_recipient_code'
        )
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
      setAccountName('')
      setError(e?.message ?? 'Account resolution failed')
    } finally {
      setResolving(false)
    }
  }

  useEffect(() => {
    const code = bankCode.trim()
    const acc = accountNumber.replace(/\D/g, '').slice(0, 10)

    if (acc !== accountNumber) setAccountNumber(acc)

    if (!code || acc.length !== 10) return
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
        .select(
          'id,profile_id,business_name,bank_name,bank_code,account_number,account_name,paystack_recipient_code'
        )
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
    setAccountName('')
    const acc = accountNumber.trim()
    if (acc.length === 10) resolveAccountName(b.code, acc)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-blue-100 p-3 text-blue-600">
          <Building2 size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Vendor Profile</h1>
          <p className="mt-1 text-sm text-gray-500">
            Update your business and payout details.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500 shadow-sm">
          Loading profile...
        </div>
      ) : null}

      {notice ? (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {notice}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {!loading && vendor ? (
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-6">
              <h2 className="text-base font-semibold text-gray-900">Business & payout details</h2>
              <p className="mt-1 text-sm text-gray-500">
                Keep your vendor information accurate for smooth withdrawals and admin review.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Business name"
                value={businessName}
                onChange={setBusinessName}
                placeholder="Your business name"
                icon={<Building2 size={16} />}
              />

              <div className="relative space-y-2">
                <label className="text-sm font-medium text-gray-700">Bank name</label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Landmark size={16} />
                  </span>
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
                    className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                {bankOpen ? (
                  <div className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg">
                    <div className="border-b px-4 py-3 text-xs text-gray-500">
                      {banksLoaded ? 'Select a bank' : 'Loading banks...'}
                    </div>

                    {filteredBanks.map((b) => (
                      <button
                        key={b.code}
                        type="button"
                        className="w-full px-4 py-3 text-left text-sm text-gray-700 transition hover:bg-gray-50"
                        onClick={() => onPickBank(b)}
                      >
                        {b.name}
                      </button>
                    ))}

                    {!filteredBanks.length ? (
                      <div className="px-4 py-4 text-sm text-gray-500">No banks found</div>
                    ) : null}

                    <div className="border-t px-4 py-3">
                      <button
                        type="button"
                        className="text-xs font-medium text-gray-500 hover:text-gray-700"
                        onClick={() => setBankOpen(false)}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>

              <Field
                label="Bank code (Paystack)"
                value={bankCode}
                onChange={setBankCode}
                disabled
                icon={<CreditCard size={16} />}
              />

              <Field
                label="Account number"
                value={accountNumber}
                onChange={(v) => {
                  const clean = v.replace(/\D/g, '').slice(0, 10)
                  setAccountNumber(clean)
                  setAccountName('')
                  setNotice(null)
                  if (bankCode.trim() && clean.length === 10) {
                    resolveAccountName(bankCode.trim(), clean)
                  }
                }}
                placeholder="Enter 10-digit account number"
                icon={<CreditCard size={16} />}
              />

              <Field
                label="Account name"
                value={accountName}
                onChange={setAccountName}
                disabled
                rightHint={resolving ? 'Verifying...' : ''}
                icon={
                  resolving ? <Loader2 size={16} className="animate-spin" /> : <BadgeCheck size={16} />
                }
              />
            </div>

            <div className="mt-6 space-y-4 border-t border-gray-100 pt-5">
              <div className="rounded-xl bg-gray-50 px-4 py-3">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Recipient code
                </div>
                <div className="mt-1 font-mono text-sm text-gray-900">
                  {vendor.paystack_recipient_code ?? '—'}
                </div>
              </div>

              {missing.length ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Missing: {missing.join(', ')}. Admin “Mark paid” will be disabled until these are
                  filled.
                </div>
              ) : null}

              <button
                onClick={save}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <CheckCircle2 size={16} />
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <div className="rounded-xl bg-blue-100 p-2 text-blue-600">
                  <ShieldCheck size={18} />
                </div>
                <h3 className="text-sm font-semibold text-gray-900">Payout readiness</h3>
              </div>

              <div className="space-y-3 text-sm text-gray-600">
                <div className="rounded-xl border border-white/80 bg-white/80 p-3">
                  Your bank details are used to prepare payout recipients for withdrawals.
                </div>
                <div className="rounded-xl border border-white/80 bg-white/80 p-3">
                  When bank details change, the recipient code is reset and recreated on the next
                  payout.
                </div>
                <div className="rounded-xl border border-white/80 bg-white/80 p-3">
                  Verified account details help prevent payout failures and delays.
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-orange-100 bg-orange-50 p-5">
              <h3 className="text-sm font-semibold text-gray-900">Helpful tip</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Pick the correct bank first, then enter the 10-digit account number to auto-verify
                the account name.
              </p>
            </div>
          </div>
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
  placeholder,
  icon,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  disabled?: boolean
  rightHint?: string
  placeholder?: string
  icon?: React.ReactNode
}) {
  return (
    <label className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-gray-700">{label}</div>
        {rightHint ? <div className="text-xs text-gray-400">{rightHint}</div> : null}
      </div>

      <div className="relative">
        {icon ? (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </span>
        ) : null}
        <input
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full rounded-xl border border-gray-200 bg-white py-3 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-gray-50 disabled:text-gray-500 ${
            icon ? 'pl-10' : 'px-4'
          }`}
        />
      </div>
    </label>
  )
}