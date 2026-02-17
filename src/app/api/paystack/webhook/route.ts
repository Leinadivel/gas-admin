import crypto from 'crypto'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs' // ensure node crypto is available

function verifySignature(rawBody: string, signature: string | null) {
  if (!signature) return false
  const secret = process.env.PAYSTACK_WEBHOOK_SECRET || process.env.PAYSTACK_SECRET_KEY
  if (!secret) return false

  // Paystack: x-paystack-signature is HMAC SHA512 of the payload :contentReference[oaicite:9]{index=9}
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

  // We only care about successful charges
  if (event?.event !== 'charge.success') {
    return NextResponse.json({ received: true })
  }

  const data = event?.data
  const reference = data?.reference as string | undefined
  const paidAt = data?.paid_at as string | undefined

  if (!reference) return NextResponse.json({ error: 'No reference' }, { status: 400 })

  // Use service role to bypass RLS for webhook processing
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Find order by paystack_reference
  const { data: order, error: findErr } = await supabase
    .from('orders')
    .select('id,payment_status')
    .eq('paystack_reference', reference)
    .maybeSingle()

  if (findErr) return NextResponse.json({ error: findErr.message }, { status: 400 })
  if (!order) return NextResponse.json({ received: true }) // ignore unknown refs

  // Idempotent update
  if (order.payment_status === 'paid') {
    return NextResponse.json({ received: true })
  }

  const { error: upErr } = await supabase
    .from('orders')
    .update({
      payment_status: 'paid',
      paid_at: paidAt ? new Date(paidAt).toISOString() : new Date().toISOString(),
      status: 'paid', // only if you truly use status='paid'; otherwise remove this line
    })
    .eq('id', order.id)

  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 400 })

  // Your DB trigger will now:
  // - insert transactions type 'order_credit'
  // - increase vendors.wallet_balance

  return NextResponse.json({ received: true })
}
