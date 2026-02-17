import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      email?: string
      role?: string
      vehicle_id?: string | null
    }

    const email = (body.email ?? '').trim().toLowerCase()
    const role = (body.role ?? 'driver').trim()
    const vehicleId = body.vehicle_id ?? null

    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
    }

    // 1) Authenticate the vendor making this request (cookie session)
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            // route handlers can set cookies via NextResponse; we don't need it here
            // keep function to satisfy API
          },
        },
      }
    )

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser()

    if (userErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const authId = user.id

    // 2) Find the vendor company row for this logged-in vendor
    const { data: vendorRow, error: vendorErr } = await supabase
      .from('vendors')
      .select('id')
      .or(`id.eq.${authId},user_id.eq.${authId},profile_id.eq.${authId}`)
      .maybeSingle()

    if (vendorErr) {
      return NextResponse.json({ error: vendorErr.message }, { status: 400 })
    }

    if (!vendorRow) {
      return NextResponse.json(
        { error: 'Vendor profile not found for this account.' },
        { status: 404 }
      )
    }

    // 3) Admin client (service role) to invite/create driver auth user
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) {
      return NextResponse.json(
        { error: 'Missing SUPABASE_SERVICE_ROLE_KEY on server.' },
        { status: 500 }
      )
    }

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey,
      { auth: { persistSession: false } }
    )

    // Invite user by email (Supabase sends them an email to set password)
    const { data: inviteData, error: inviteErr } =
      await admin.auth.admin.inviteUserByEmail(email)

    if (inviteErr) {
      return NextResponse.json({ error: inviteErr.message }, { status: 400 })
    }

    const driverUserId = inviteData.user?.id
    if (!driverUserId) {
      return NextResponse.json(
        { error: 'Invite succeeded but no user id returned.' },
        { status: 500 }
      )
    }

    // 4) Link driver to vendor
    // Note: "invited_by" exists in your schema; use vendor auth id
    const { error: linkErr } = await admin.from('vendor_staff').insert({
      vendor_id: vendorRow.id,
      user_id: driverUserId,
      role,
      vehicle_id: vehicleId,
      is_active: true,
      invited_by: authId,
    })

    if (linkErr) {
      return NextResponse.json({ error: linkErr.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'Unknown error' },
      { status: 500 }
    )
  }
}
