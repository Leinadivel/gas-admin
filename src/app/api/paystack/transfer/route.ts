import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { NextRequest } from 'next/server'

export const runtime = 'nodejs'

function supabaseServer(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
        },
      },
    }
  )
  return { supabase, res }
}

async function isAdmin(supabase: any, userId: string) {
  // Adjust this to YOUR schema:
  // Option A: profiles.role = 'admin'
  const { data, error } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle()
  if (error) return false
  return (data?.role ?? '') === 'admin'
}

async function paystackCreateRecipient(params: {
  name: string
  account_number: string
  bank_code: string
}) {
  const r = await fetch('https://api.paystack.co/transferrecipient', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY!}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'nuban',
      name: params.name,
      account_number: params.account_number,
      bank_code: params.bank_code,
      currency: 'NGN',
    }),
  })

  const json = await r.json()
  if (!r.ok || !json?.status) {
    throw new Error(json?.message ?? 'Failed to create transfer recipient')
  }
  return json.data.recipient_code as string
}

async function paystackInitiateTransfer(params: {
  amountNgn: number
  recipient_code: string
  reason: string
  reference: string
}) {
  const amountKobo = Math.round(params.amountNgn * 100)

  const r = await fetch('https://api.paystack.co/transfer', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY!}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      source: 'balance',
      amount: amountKobo,
      recipient: params.recipient_code,
      reason: params.reason,
      reference: params.reference,
    }),
  })

  const json = await r.json()
  if (!r.ok || !json?.status) {
    throw new Error(json?.message ?? 'Failed to initiate transfer')
  }

  return {
    transfer_code: json.data.transfer_code as string,
    reference: json.data.reference as string,
    status: json.data.status as string,
  }
}

export async function POST(req: NextRequest) {
  try {
    const { supabase } = supabaseServer(req)

    // 1) Must be logged-in admin (cookie session)
    const { data: userData, error: userErr } = await supabase.auth.getUser()
    if (userErr) return NextResponse.json({ error: userErr.message }, { status: 401 })
    const user = userData.user
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const okAdmin = await isAdmin(supabase, user.id)
    if (!okAdmin) return NextResponse.json({ error: 'Admin only' }, { status: 403 })

    // 2) request_id
    const body = await req.json()
    const request_id = String(body?.request_id ?? '')
    if (!request_id) return NextResponse.json({ error: 'request_id required' }, { status: 400 })

    // 3) Load payout request + vendor bank details
    const { data: pr, error: prErr } = await supabase
      .from('vendor_payout_requests')
      .select(
        `
        id,vendor_id,amount,status,
        vendors:vendors (id,business_name,bank_name,bank_code,account_number,account_name,paystack_recipient_code)
      `
      )
      .eq('id', request_id)
      .maybeSingle()

    if (prErr) return NextResponse.json({ error: prErr.message }, { status: 400 })
    if (!pr) return NextResponse.json({ error: 'Payout request not found' }, { status: 404 })

    if (pr.status !== 'approved') {
      return NextResponse.json({ error: `Request must be approved. Current: ${pr.status}` }, { status: 400 })
    }

    const vendor = Array.isArray(pr.vendors) ? pr.vendors[0] : pr.vendors
    if (!vendor) return NextResponse.json({ error: 'Vendor not found for request' }, { status: 400 })

    if (!vendor.account_number || !vendor.bank_code) {
      return NextResponse.json(
        { error: 'Vendor bank details incomplete (need account_number + bank_code).' },
        { status: 400 }
      )
    }

    const amount = Number(pr.amount ?? 0)
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Invalid payout amount' }, { status: 400 })
    }

    // 4) Ensure recipient_code
    let recipient = vendor.paystack_recipient_code as string | null

    if (!recipient) {
      const name = (vendor.account_name || vendor.business_name || 'Vendor') as string
      recipient = await paystackCreateRecipient({
        name,
        account_number: vendor.account_number,
        bank_code: vendor.bank_code,
      })

      const { error: upVendErr } = await supabase
        .from('vendors')
        .update({
          paystack_recipient_code: recipient,
          paystack_recipient_created_at: new Date().toISOString(),
        })
        .eq('id', vendor.id)

      if (upVendErr) {
        return NextResponse.json({ error: upVendErr.message }, { status: 400 })
      }
    }

    // 5) Initiate transfer on Paystack
    const reference = `payout_${pr.id}_${Date.now()}`
    const reason = `Payout ${pr.id}`

    const transfer = await paystackInitiateTransfer({
      amountNgn: amount,
      recipient_code: recipient,
      reason,
      reference,
    })

    // 6) Mark paid in DB (this should debit wallet + insert transactions)
    // IMPORTANT: Only do this after Paystack accepted transfer initiation.
    const { error: rpcErr } = await supabase.rpc('admin_mark_payout_request_paid', {
      p_request_id: pr.id,
      p_paystack_reference: transfer.transfer_code || transfer.reference,
    })

    if (rpcErr) {
      return NextResponse.json(
        { error: `Paystack transfer started, but DB mark-paid failed: ${rpcErr.message}`, transfer },
        { status: 500 }
      )
    }

    // 7) Store extra transfer details (optional)
    await supabase
      .from('vendor_payout_requests')
      .update({
        paystack_transfer_code: transfer.transfer_code,
        paystack_transfer_reference: transfer.reference,
      })
      .eq('id', pr.id)

    return NextResponse.json({ ok: true, transfer })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Server error' }, { status: 500 })
  }
}