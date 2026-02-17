import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

type Body = {
  vendor_id: string
  email: string
  full_name?: string
  role?: 'driver' | 'manager' | 'owner'
  vehicle_id?: string | null
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body

    if (!body?.vendor_id || !body?.email) {
      return NextResponse.json({ error: 'vendor_id and email are required' }, { status: 400 })
    }

    const role = body.role ?? 'driver'
    if (!['driver', 'manager', 'owner'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // 1) User-context client (cookie session) to confirm admin
    const cookieStore = await cookies()
    const supabaseUser = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: authData, error: authErr } = await supabaseUser.auth.getUser()
    if (authErr || !authData?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // IMPORTANT: your DB must have RPC function public.is_admin()
    const { data: isAdmin, error: adminErr } = await supabaseUser.rpc('is_admin')
    if (adminErr) return NextResponse.json({ error: adminErr.message }, { status: 403 })
    if (isAdmin !== true) return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

    // 2) Service role client for privileged operations (auth admin)
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) {
      return NextResponse.json({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey,
      { auth: { persistSession: false } }
    )

    // Ensure vendor exists
    const { data: vendorRow, error: vendorErr } = await supabaseAdmin
      .from('vendors')
      .select('id')
      .eq('id', body.vendor_id)
      .maybeSingle()

    if (vendorErr) return NextResponse.json({ error: vendorErr.message }, { status: 400 })
    if (!vendorRow) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })

    const redirectTo =
      process.env.NEXT_PUBLIC_DRIVER_INVITE_REDIRECT_TO ||
      `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`

    // Create invited auth user
    const { data: inviteData, error: inviteErr } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(body.email.trim().toLowerCase(), {
        redirectTo,
      })

    if (inviteErr) return NextResponse.json({ error: inviteErr.message }, { status: 400 })

    const newUserId = inviteData?.user?.id
    if (!newUserId) return NextResponse.json({ error: 'Invite created no user id' }, { status: 500 })

    // Optional profile upsert (adjust fields to your schema)
    if (body.full_name?.trim()) {
      await supabaseAdmin
        .from('profiles')
        .upsert({ id: newUserId, full_name: body.full_name.trim() }, { onConflict: 'id' })
    }

    // Link to vendor_staff
    const { error: staffErr } = await supabaseAdmin
      .from('vendor_staff')
      .upsert(
        {
          vendor_id: body.vendor_id,
          user_id: newUserId,
          role,
          vehicle_id: body.vehicle_id ?? null,
          is_active: true,
          invited_by: authData.user.id,
        },
        { onConflict: 'vendor_id,user_id' }
      )

    if (staffErr) {
      return NextResponse.json({ error: staffErr.message }, { status: 400 })
    }

    return NextResponse.json({
      ok: true,
      user_id: newUserId,
      email: body.email,
      vendor_id: body.vendor_id,
      role,
      vehicle_id: body.vehicle_id ?? null,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Server error' }, { status: 500 })
  }
}
