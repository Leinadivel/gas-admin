import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY
    if (!secret) return NextResponse.json({ error: 'Missing PAYSTACK_SECRET_KEY' }, { status: 500 })

    const body = await req.json()
    const bank_code = String(body.bank_code || '').trim()
    const account_number = String(body.account_number || '').trim()

    if (!bank_code || account_number.length !== 10) {
      return NextResponse.json({ error: 'Invalid bank_code/account_number' }, { status: 400 })
    }

    const url = `https://api.paystack.co/bank/resolve?account_number=${encodeURIComponent(
      account_number
    )}&bank_code=${encodeURIComponent(bank_code)}`

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${secret}` },
      cache: 'no-store',
    })
    const json = await res.json()

    if (!res.ok) {
      return NextResponse.json({ error: json?.message || 'Could not resolve account' }, { status: 400 })
    }

    const account_name = json?.data?.account_name
    return NextResponse.json({ account_name })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}