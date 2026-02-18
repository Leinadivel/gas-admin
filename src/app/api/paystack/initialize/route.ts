import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function adminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, service, {
    auth: { persistSession: false },
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const order_id = String(body?.order_id ?? '').trim()
    const email = String(body?.email ?? '').trim().toLowerCase()

    if (!order_id) return NextResponse.json({ error: 'order_id required' }, { status: 400 })
    if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 })

    const supabaseAdmin = adminSupabase()

    // 1) Resolve auth user by email (admin)
    const { data: userList, error: userErr } =
      await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 })

    if (userErr) return NextResponse.json({ error: userErr.message }, { status: 500 })

    const user = userList?.users?.find((u) => (u.email ?? '').toLowerCase() === email)
    if (!user) return NextResponse.json({ error: 'User not found for email' }, { status: 404 })

    // 2) Load order (must belong to this user)
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('id,user_id,total_amount,payment_status')
      .eq('id', order_id)
      .maybeSingle()

    if (orderErr) return NextResponse.json({ error: orderErr.message }, { status: 400 })
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    if (order.user_id !== user.id) {
      return NextResponse.json({ error: 'Order does not belong to this user' }, { status: 403 })
    }

    if (order.payment_status === 'paid') {
      return NextResponse.json({ error: 'Order already paid' }, { status: 409 })
    }

    const amountNgn = Number(order.total_amount ?? 0)
    if (!Number.isFinite(amountNgn) || amountNgn <= 0) {
      return NextResponse.json({ error: 'Invalid order amount' }, { status: 400 })
    }

    // Paystack expects amount in kobo
    const amountKobo = Math.round(amountNgn * 100)

    // 3) Initialize Paystack transaction
    const reference = `order_${order.id}_${Date.now()}`

    const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY!}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: amountKobo,
        reference,
        metadata: { order_id: order.id, user_id: user.id },
        // Optional. We mainly rely on webhook.
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/vendor/login`,
      }),
    })

    const json = await paystackRes.json()

    if (!paystackRes.ok || !json?.status) {
      return NextResponse.json(
        { error: json?.message ?? 'Paystack initialize failed', raw: json },
        { status: 400 }
      )
    }

    const authorization_url = json.data.authorization_url as string

    // 4) Store reference + method
    const { error: upErr } = await supabaseAdmin
      .from('orders')
      .update({ paystack_reference: reference, payment_method: 'paystack' })
      .eq('id', order.id)

    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 400 })

    return NextResponse.json({ authorization_url, reference })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Server error' }, { status: 500 })
  }
}
