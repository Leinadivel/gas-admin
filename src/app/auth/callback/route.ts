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

  // Supports both flows:
  // 1) PKCE/OAuth style: ?code=...
  // 2) Email link / invite style: ?token_hash=...&type=invite|magiclink|recovery|signup
  const code = url.searchParams.get('code')
  const token_hash = url.searchParams.get('token_hash')
  const type = url.searchParams.get('type') // invite, magiclink, recovery, signup, email_change...

  const nextRaw = url.searchParams.get('next')
  const nextSafe = safeNextPath(nextRaw)

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

  // ✅ 1) Exchange code (PKCE flow)
  if (code) {
    const { error: exErr } = await supabase.auth.exchangeCodeForSession(code)
    if (exErr) {
      return NextResponse.redirect(new URL('/login', url.origin))
    }
  } else if (token_hash && type) {
    // ✅ 2) Verify OTP for invite/magiclink flows
    const { error: verifyErr } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    })

    if (verifyErr) {
      return NextResponse.redirect(new URL('/login', url.origin))
    }
  } else {
    // Nothing usable
    return NextResponse.redirect(new URL('/login', url.origin))
  }

  // Respect explicit next param for existing flows
  if (nextSafe) {
    return NextResponse.redirect(new URL(nextSafe, url.origin))
  }

  // Detect driver invite acceptance
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user?.id) {
    const { data: staffRows, error: staffErr } = await supabase
      .from('vendor_staff')
      .select('id, role, is_active')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)

    if (!staffErr) {
      const staff = staffRows?.[0] ?? null
      if (
        staff &&
        staff.is_active === true &&
        (staff.role === 'driver' || staff.role === 'dispatcher' || staff.role === 'manager')
      ) {
        return NextResponse.redirect(new URL('/driver/invite', url.origin))
      }
    }
  }

  // Default
  return NextResponse.redirect(new URL('/dashboard', url.origin))
}