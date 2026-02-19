import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getBearerToken(req: Request) {
  const auth = req.headers.get('authorization') || ''
  if (!auth.toLowerCase().startsWith('bearer ')) return null
  return auth.slice('Bearer '.length).trim() || null
}

export async function POST(req: Request) {
  try {
    const token = getBearerToken(req)
    if (!token) {
      return NextResponse.json(
        { error: 'Missing Authorization: Bearer <access_token>' },
        { status: 401 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const paystackKey = process.env.PAYSTACK_SECRET_KEY

    if (!supabaseUrl || !anonKey) {
      return NextResponse.json({ error: 'Server misconfig: Supabase URL/Anon key missing' }, { status: 500 })
    }
    if (!serviceKey) {
      return NextResponse.json({ error: 'Server misconfig: SUPABASE_SERVICE_ROLE_KEY missing' }, { status: 500 })
    }
    if (!paystackKey) {
      return NextResponse.json({ error: 'Server misconfig: PAYSTACK_SECRET_KEY missing' }, { status: 500 })
    }

    // User-scoped client (RLS applies)
    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    })

    // Confirm the token is valid + get user
    const { data: userData, error: userErr } = await supabaseUser.auth.getUser()
    if (userErr || !userData.user) {
      return NextResponse.json({ error: userErr?.message ?? 'Not authenticated' }, { status: 401 })
    }
    const user = userData.user

    const body = await req.json().catch(() => ({}))
    const order_id = String(body?.order_id ?? '')
    if (!order_id) return NextResponse.json({ error: 'order_id required' }, { status: 400 })

    // 1) Load order (must belong to this user)
    const { data: order, error: orderErr } = await supabaseUser
      .from('orders')
      .select('id,user_id,total_amount,payment_status')
      .eq('id', order_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (orderErr) return NextResponse.json({ error: orderErr.message }, { status: 400 })
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    if (order.payment_status === 'paid') {
      return NextResponse.json({ error: 'Order already paid' }, { status: 409 })
    }

    const amountNgn = Number(order.total_amount ?? 0)
    if (!Number.isFinite(amountNgn) || amountNgn <= 0) {
      return NextResponse.json({ error: 'Invalid order amount' }, { status: 400 })
    }

    const amountKobo = Math.round(amountNgn * 100)
    const reference = `order_${order.id}_${Date.now()}`

    // 2) Initialize Paystack
    const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${paystackKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email, // Paystack requires email
        amount: amountKobo, // kobo
        reference,
        metadata: { order_id: order.id, user_id: user.id },
        // callback_url is optional (webhook is the real source of truth)
      }),
    })

    const json = await paystackRes.json().catch(() => ({}))

    if (!paystackRes.ok || !json?.status) {
      return NextResponse.json(
        { error: json?.message ?? 'Paystack initialize failed', raw: json },
        { status: paystackRes.status || 400 }
      )
    }

    const authorization_url = json.data?.authorization_url as string | undefined
    if (!authorization_url) {
      return NextResponse.json({ error: 'Paystack did not return authorization_url', raw: json }, { status: 400 })
    }

    // 3) Store reference on order using SERVICE ROLE (avoid RLS issues)
    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

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
