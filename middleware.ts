import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

function isProtectedPath(pathname: string) {
  return (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/vendor') ||
    pathname.startsWith('/driver')
  )
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const pathname = req.nextUrl.pathname

  // Only run checks on protected areas
  if (!isProtectedPath(pathname)) return res

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Not logged in → send to correct login page
  if (!user) {
    const url = req.nextUrl.clone()
    if (pathname.startsWith('/admin')) url.pathname = '/admin/login'
    else if (pathname.startsWith('/vendor')) url.pathname = '/vendor/login'
    else if (pathname.startsWith('/driver')) url.pathname = '/driver/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  // Fetch role from profiles (RLS should allow id=auth.uid())
  const { data: profile } = await supabase
    .from('profiles')
    .select('role,is_admin')
    .eq('id', user.id)
    .maybeSingle()

  const role = profile?.role ?? null
  const isAdmin = profile?.is_admin === true

  // ✅ Admin routes: allow only admins
  if (pathname.startsWith('/admin')) {
    if (!isAdmin) {
      const url = req.nextUrl.clone()
      url.pathname = role === 'vendor' ? '/vendor/dashboard' : '/'
      return NextResponse.redirect(url)
    }
    return res
  }

  // ✅ Vendor routes: allow only vendors
  if (pathname.startsWith('/vendor')) {
    if (role !== 'vendor') {
      const url = req.nextUrl.clone()
      url.pathname = isAdmin ? '/admin/dashboard' : '/'
      return NextResponse.redirect(url)
    }
    return res
  }

  // ✅ Driver routes: allow only drivers (if you use this role)
  if (pathname.startsWith('/driver')) {
    if (role !== 'driver') {
      const url = req.nextUrl.clone()
      url.pathname = isAdmin ? '/admin/dashboard' : '/'
      return NextResponse.redirect(url)
    }
    return res
  }

  return res
}

export const config = {
  matcher: ['/admin/:path*', '/vendor/:path*', '/driver/:path*'],
}