import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function safeNextPath(nextParam: string | null) {
  if (!nextParam) return null
  if (!nextParam.startsWith('/')) return null
  if (nextParam.startsWith('//')) return null
  return nextParam
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')

  // keep support for your existing next param (admin/vendor flows)
  const nextRaw = url.searchParams.get('next')
  const nextSafe = safeNextPath(nextRaw)

  if (!code) {
    return NextResponse.redirect(new URL('/login', url.origin))
  }

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
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )

  const { error: exErr } = await supabase.auth.exchangeCodeForSession(code)
  if (exErr) {
    return NextResponse.redirect(new URL('/login', url.origin))
  }

  // If caller provided a safe next, respect it (existing behavior)
  if (nextSafe) {
    return NextResponse.redirect(new URL(nextSafe, url.origin))
  }

  // Otherwise detect driver invite acceptance:
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user?.id) {
    // If this auth user is in vendor_staff, send them to set-password page
    const { data: staffRows } = await supabase
      .from('vendor_staff')
      .select('id, role, is_active')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)

    const staff = staffRows?.[0] ?? null
    if (staff && (staff.role === 'driver' || staff.role === 'dispatcher' || staff.role === 'manager')) {
      return NextResponse.redirect(new URL('/driver/invite', url.origin))
    }
  }

  // Default for everyone else
  return NextResponse.redirect(new URL('/dashboard', url.origin))
}