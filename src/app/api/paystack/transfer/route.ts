import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!

function sb() {
  return createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function requireEnv() {
  if (!SUPABASE_URL || !SERVICE_ROLE) throw new Error('Missing Supabase env vars')
  if (!PAYSTACK_SECRET) throw new Error('Missing PAYSTACK_SECRET_KEY')
}

async function paystackFetch(path: string, body: any) {
  const res = await fetch(`https://api.paystack.co${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const json = await res.json().catch(() => ({}))
  if (!res.ok || !json?.status) {
    const msg = json?.message || `Paystack error (${res.status})`
    const err = new Error(msg) as any
    err.raw = json
    err.status = res.status
    throw err
  }
  return json
}

export async function POST(req: Request) {
  try {
    requireEnv()

    const { request_id } = await req.json().catch(() => ({}))
    const requestId = String(request_id ?? '')
    if (!requestId) {
      return NextResponse.json({ error: 'request_id required' }, { status: 400 })
    }

    const supabase = sb()

    // 1) Load payout request
    const { data: pr, error: prErr } = await supabase
      .from('vendor_payout_requests')
      .select('id,vendor_id,amount,status')
      .eq('id', requestId)
      .maybeSingle()

    if (prErr) return NextResponse.json({ error: prErr.message }, { status: 400 })
    if (!pr) return NextResponse.json({ error: 'Payout request not found' }, { status: 404 })

    if (pr.status !== 'approved') {
      return NextResponse.json({ error: 'Payout must be APPROVED first' }, { status: 409 })
    }

    const amountNgn = Number(pr.amount ?? 0)
    if (!Number.isFinite(amountNgn) || amountNgn <= 0) {
      return NextResponse.json({ error: 'Invalid payout amount' }, { status: 400 })
    }

    // 2) Load vendor bank details
    const { data: v, error: vErr } = await supabase
      .from('vendors')
      .select('id,business_name,bank_name,bank_code,account_number,account_name,paystack_recipient_code')
      .eq('id', pr.vendor_id)
      .maybeSingle()

    if (vErr) return NextResponse.json({ error: vErr.message }, { status: 400 })
    if (!v) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })

    const missing: string[] = []
    if (!v.bank_code) missing.push('bank_code')
    if (!v.account_number) missing.push('account_number')
    if (!v.account_name) missing.push('account_name')

    if (missing.length) {
      return NextResponse.json(
        { error: `Vendor bank details incomplete: ${missing.join(', ')}` },
        { status: 409 }
      )
    }

    // 3) Ensure Paystack recipient exists
    let recipientCode = v.paystack_recipient_code as string | null

    if (!recipientCode) {
      const recipJson = await paystackFetch('/transferrecipient', {
        type: 'nuban',
        name: v.account_name,
        account_number: v.account_number,
        bank_code: v.bank_code,
        currency: 'NGN',
        metadata: {
          vendor_id: v.id,
          bank_name: v.bank_name,
        },
      })

      recipientCode = recipJson.data.recipient_code as string

      const { error: upRecErr } = await supabase
        .from('vendors')
        .update({ paystack_recipient_code: recipientCode })
        .eq('id', v.id)

      if (upRecErr) {
        return NextResponse.json({ error: upRecErr.message }, { status: 400 })
      }
    }

    // 4) Initiate transfer
    const amountKobo = Math.round(amountNgn * 100)
    const transferReference = `payout_${pr.id}_${Date.now()}`

    const transferJson = await paystackFetch('/transfer', {
      source: 'balance',
      amount: amountKobo,
      recipient: recipientCode,
      reference: transferReference,
      reason: `Vendor payout ${pr.id}`,
    })

    const transferCode =
      (transferJson.data?.transfer_code as string | undefined) ?? transferReference

    // 5) Mark payout as paid in DB (your existing RPC)
    const { error: paidErr } = await supabase.rpc('admin_mark_payout_request_paid', {
      p_request_id: pr.id,
      p_paystack_reference: transferCode,
    })

    if (paidErr) {
      // IMPORTANT: transfer has started but DB not updated
      return NextResponse.json(
        {
          error: `Transfer started (${transferCode}) but DB update failed: ${paidErr.message}`,
          transfer: transferJson.data,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      transfer: transferJson.data,
      paystack_reference: transferCode,
    })
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'Server error', raw: e?.raw },
      { status: e?.status || 500 }
    )
  }
}