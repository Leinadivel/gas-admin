import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { NextRequest } from 'next/server'

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
          cookies.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options)
          })
        },
      },
    }
  )
  return { supabase, res }
}

export async function POST(req: NextRequest) {
  try {
    const { supabase } = supabaseServer(req)

    const { data: userData } = await supabase.auth.getUser()
    const user = userData.user
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const body = await req.json()
    const order_id = String(body?.order_id ?? '')
    if (!order_id) return NextResponse.json({ error: 'order_id required' }, { status: 400 })

    // 1) Load order (must belong to this user)
    const { data: order, error: orderErr } = await supabase
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

    // Paystack expects amount in kobo for NGN
    const amountKobo = Math.round(amountNgn * 100)

    // 2) Initialize Paystack transaction
    const reference = `order_${order.id}_${Date.now()}`
    const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY!}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email, // required :contentReference[oaicite:5]{index=5}
        amount: amountKobo, // required (kobo) :contentReference[oaicite:6]{index=6}
        reference,
        metadata: { order_id: order.id, user_id: user.id },
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/paystack/callback`, // optional, we rely on webhook
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

    // 3) Store reference on order
    const { error: upErr } = await supabase
      .from('orders')
      .update({ paystack_reference: reference, payment_method: 'paystack' })
      .eq('id', order.id)

    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 400 })

    return NextResponse.json({ authorization_url, reference })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Server error' }, { status: 500 })
  }
}
