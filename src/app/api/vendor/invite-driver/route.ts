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
          setAll() {
            // not needed in this handler
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

    // 2) Find vendor row (NO .single / .maybeSingle)
    const { data: vendorRows, error: vendorErr } = await supabase
      .from('vendors')
      .select('id, profile_id, user_id, created_at')
      .or(`profile_id.eq.${authId},user_id.eq.${authId},id.eq.${authId}`)
      .order('created_at', { ascending: false })

    if (vendorErr) {
      return NextResponse.json({ error: vendorErr.message }, { status: 400 })
    }

    const vendorRow =
      vendorRows?.find((r) => r.profile_id === authId) ??
      vendorRows?.find((r) => r.user_id === authId) ??
      vendorRows?.[0] ??
      null

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

    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
      auth: { persistSession: false },
    })

    // 4) Redirect URL for invite -> callback -> driver invite page
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL

    if (!siteUrl) {
      return NextResponse.json(
        { error: 'Missing NEXT_PUBLIC_SITE_URL (or VERCEL_URL).' },
        { status: 500 }
      )
    }

    const redirectTo = `${siteUrl}/auth/callback`

    const { data: inviteData, error: inviteErr } =
      await admin.auth.admin.inviteUserByEmail(email, { redirectTo })

    if (inviteErr) {
      return NextResponse.json(
        { error: inviteErr.message, redirectTo },
        { status: 400 }
      )
    }

    const driverUserId = inviteData.user?.id
    if (!driverUserId) {
      return NextResponse.json(
        { error: 'Invite succeeded but no user id returned.' },
        { status: 500 }
      )
    }

    // 5) Create vendor_staff record
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

    return NextResponse.json({ ok: true, redirectTo })
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'Unknown error' },
      { status: 500 }
    )
  }
}