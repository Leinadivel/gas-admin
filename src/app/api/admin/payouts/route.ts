import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(req: Request) {
  try {
    if (!SUPABASE_URL || !SERVICE_ROLE) {
      return NextResponse.json({ error: 'Missing Supabase env vars' }, { status: 500 })
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const url = new URL(req.url)
    const limit = Math.min(Number(url.searchParams.get('limit') ?? 200), 500)

    const { data, error } = await supabase
      .from('vendor_payout_requests')
      .select(
        `
        id,vendor_id,amount,status,requested_at,reviewed_at,reviewed_by,rejection_reason,paystack_reference,
        vendors:vendors (business_name, bank_name, bank_code, account_number, account_name, paystack_recipient_code)
      `
      )
      .order('requested_at', { ascending: false })
      .limit(limit)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ data: data ?? [] })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Server error' }, { status: 500 })
  }
}