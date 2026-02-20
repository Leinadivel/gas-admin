'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

type Bank = { name: string; code: string }

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
  const [banks, setBanks] = useState<Bank[]>([])

  // form
  const [businessName, setBusinessName] = useState('')
  const [bankCode, setBankCode] = useState('')
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountName, setAccountName] = useState('')

  const bankLabel = useMemo(() => {
    const b = banks.find((x) => x.code === bankCode)
    return b?.name ?? bankName ?? ''
  }, [banks, bankCode, bankName])

  useEffect(() => {
    let mounted = true

    const load = async () => {
      setLoading(true)
      setError(null)
      setNotice(null)

      // 1) user
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

      // 2) vendor row
      const { data: vendorRow, error: vErr } = await supabase
        .from('vendors')
        .select('id,business_name,bank_name,bank_code,account_number,account_name,paystack_recipient_code')
        .or(`id.eq.${authId},user_id.eq.${authId},profile_id.eq.${authId}`)
        .maybeSingle()

      if (!mounted) return

      if (vErr) {
        setError(vErr.message)
        setLoading(false)
        return
      }
      if (!vendorRow) {
        setError('Vendor profile not found for this account.')
        setLoading(false)
        return
      }

      const v = vendorRow as VendorRow
      setVendor(v)

      setBusinessName(v.business_name ?? '')
      setBankCode(v.bank_code ?? '')
      setBankName(v.bank_name ?? '')
      setAccountNumber(v.account_number ?? '')
      setAccountName(v.account_name ?? '')

      // 3) load paystack banks (optional but recommended)
      try {
        const r = await fetch('/api/paystack/banks', { cache: 'no-store' })
        const j = await r.json().catch(() => ({}))
        if (r.ok && Array.isArray(j?.banks)) setBanks(j.banks)
      } catch {
        // ignore — form still works with manual values
      }

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

    // basic validation
    const acct = accountNumber.replace(/\s+/g, '')
    if (acct && acct.length !== 10) {
      setError('Account number must be 10 digits (NUBAN).')
      setSaving(false)
      return
    }

    // bank_code is needed for Paystack transfers
    if (!bankCode.trim()) {
      setError('Please select a bank (bank_code is required).')
      setSaving(false)
      return
    }

    // bank_name should match bankCode selection (we still store both)
    const finalBankName = banks.find((b) => b.code === bankCode)?.name ?? bankName

    const { error: upErr } = await supabase
      .from('vendors')
      .update({
        business_name: businessName.trim() || null,
        bank_code: bankCode.trim(),
        bank_name: finalBankName?.trim() || null,
        account_number: acct || null,
        account_name: accountName.trim() || null,

        // IMPORTANT:
        // if vendor changes bank details after recipient was created,
        // force recipient_code to null so server will re-create it correctly.
        paystack_recipient_code: null,
      })
      .eq('id', vendor.id)

    if (upErr) {
      setError(upErr.message)
      setSaving(false)
      return
    }

    setNotice('Saved. Bank changes will apply to the next payout.')
    setSaving(false)

    // refresh vendor to show updated values
    const { data: v2 } = await supabase
      .from('vendors')
      .select('id,business_name,bank_name,bank_code,account_number,account_name,paystack_recipient_code')
      .eq('id', vendor.id)
      .maybeSingle()

    if (v2) setVendor(v2 as VendorRow)
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Profile</h1>
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
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Business name">
              <input
                className="w-full rounded-md border bg-white px-3 py-2 outline-none focus:ring-2"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Gas Vendor Ltd"
              />
            </Field>

            <Field label="Vendor ID">
              <input
                className="w-full rounded-md border bg-gray-50 px-3 py-2 font-mono text-xs"
                value={vendor.id}
                readOnly
              />
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Bank">
              {banks.length ? (
                <select
                  className="w-full rounded-md border bg-white px-3 py-2 text-sm"
                  value={bankCode}
                  onChange={(e) => {
                    const code = e.target.value
                    setBankCode(code)
                    const name = banks.find((b) => b.code === code)?.name ?? ''
                    setBankName(name)
                  }}
                >
                  <option value="">Select bank…</option>
                  {banks.map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="space-y-2">
                  <input
                    className="w-full rounded-md border bg-white px-3 py-2 outline-none focus:ring-2"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="Bank name (manual)"
                  />
                  <input
                    className="w-full rounded-md border bg-white px-3 py-2 outline-none focus:ring-2"
                    value={bankCode}
                    onChange={(e) => setBankCode(e.target.value)}
                    placeholder="Bank code (manual, required for Paystack)"
                  />
                </div>
              )}
              <div className="mt-1 text-xs opacity-60">Selected: {bankLabel || '—'}</div>
            </Field>

            <Field label="Account number (10 digits)">
              <input
                className="w-full rounded-md border bg-white px-3 py-2 outline-none focus:ring-2"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="0123456789"
                inputMode="numeric"
              />
            </Field>

            <Field label="Account name">
              <input
                className="w-full rounded-md border bg-white px-3 py-2 outline-none focus:ring-2"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Vendor Account Name"
              />
            </Field>

            <Field label="Paystack recipient (auto)">
              <input
                className="w-full rounded-md border bg-gray-50 px-3 py-2 font-mono text-xs"
                value={vendor.paystack_recipient_code ?? '—'}
                readOnly
              />
              <div className="mt-1 text-xs opacity-60">
                This will be created automatically when admin pays out.
              </div>
            </Field>
          </div>

          <button
            onClick={save}
            disabled={saving}
            className="rounded-md bg-black text-white px-4 py-2 text-sm disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>

          <div className="text-xs opacity-60">
            If you change bank details, we reset recipient_code so Paystack payout uses the new account.
          </div>
        </div>
      ) : null}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-sm font-medium">{label}</div>
      <div className="mt-2">{children}</div>
    </div>
  )
}