import crypto from 'crypto'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

function verifySignature(rawBody: string, signature: string | null) {
  if (!signature) return false

  // Paystack signs webhooks with your secret key (some people store it separately)
  const secret = process.env.PAYSTACK_WEBHOOK_SECRET || process.env.PAYSTACK_SECRET_KEY
  if (!secret) return false

  const hash = crypto.createHmac('sha512', secret).update(rawBody).digest('hex')
  return hash === signature
}

export async function POST(req: Request) {
  const signature = req.headers.get('x-paystack-signature')
  const rawBody = await req.text()

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = JSON.parse(rawBody)

  // Only care about successful charges
  if (event?.event !== 'charge.success') {
    return NextResponse.json({ received: true })
  }

  const data = event?.data
  const reference = data?.reference as string | undefined
  const paidAt = data?.paid_at as string | undefined

  if (!reference) return NextResponse.json({ error: 'No reference' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Find order by reference
  const { data: order, error: findErr } = await supabase
    .from('orders')
    .select('id,status,payment_status')
    .eq('paystack_reference', reference)
    .maybeSingle()

  if (findErr) return NextResponse.json({ error: findErr.message }, { status: 400 })
  if (!order) return NextResponse.json({ received: true }) // ignore unknown refs

  // If already paid, do nothing (idempotent)
  if (order.payment_status === 'paid') {
    return NextResponse.json({ received: true })
  }

  // Only set status='paid' if the order is currently awaiting payment (safe)
  const nextStatus =
    order.status === 'awaiting_payment' ? 'paid' : order.status

  const { error: upErr } = await supabase
    .from('orders')
    .update({
      payment_status: 'paid',
      paid_at: paidAt ? new Date(paidAt).toISOString() : new Date().toISOString(),
      status: nextStatus,
    })
    .eq('id', order.id)
    .neq('payment_status', 'paid') // extra safety

  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 400 })

  // DB trigger should:
  // - insert transactions (order_credit)
  // - credit vendors.wallet_balance

  return NextResponse.json({ received: true })
}
