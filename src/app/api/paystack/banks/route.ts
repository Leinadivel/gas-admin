import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const res = await fetch('https://api.paystack.co/bank?currency=NGN', {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY!}`,
      },
      // prevent caching weirdness
      cache: 'no-store',
    })

    const json = await res.json().catch(() => ({}))

    if (!res.ok || !json?.status) {
      return NextResponse.json(
        { error: json?.message ?? `Paystack banks failed (${res.status})`, raw: json },
        { status: 400 }
      )
    }

    // return only what we need
    const banks = (json.data ?? []).map((b: any) => ({
      name: b.name as string,
      code: b.code as string,
    }))

    return NextResponse.json({ banks })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Server error' }, { status: 500 })
  }
}