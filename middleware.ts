import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

function isAdminRootPath(pathname: string) {
  // ✅ Your admin app is at root (A)
  // Add/remove items here to match your actual admin routes
  const adminRoots = [
    '/login',
    '/dashboard',
    '/vendors',
    '/payouts',
    '/transactions',
    '/settings',
    '/orders',
    '/users',
  ]
  return adminRoots.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

function isVendorPath(pathname: string) {
  return pathname.startsWith('/vendor')
}

function isDriverPath(pathname: string) {
  return pathname.startsWith('/driver')
}

function isProtectedPath(pathname: string) {
  return isAdminRootPath(pathname) || isVendorPath(pathname) || isDriverPath(pathname)
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const pathname = req.nextUrl.pathname

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
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options)
          })
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

    if (isVendorPath(pathname)) url.pathname = '/vendor/login'
    else if (isDriverPath(pathname)) url.pathname = '/driver/login'
    else url.pathname = '/login' // admin root login

    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  // Read role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role,is_admin')
    .eq('id', user.id)
    .maybeSingle()

  const role = profile?.role ?? null
  const isAdmin = profile?.is_admin === true

  // ✅ Admin root routes: ONLY admins
  if (isAdminRootPath(pathname)) {
    if (!isAdmin) {
      const url = req.nextUrl.clone()
      url.pathname = role === 'vendor' ? '/vendor/dashboard' : '/'
      return NextResponse.redirect(url)
    }
    return res
  }

  // ✅ Vendor routes: ONLY vendors (admins may be redirected to admin dashboard)
  if (isVendorPath(pathname)) {
    if (role !== 'vendor') {
      const url = req.nextUrl.clone()
      url.pathname = isAdmin ? '/dashboard' : '/'
      return NextResponse.redirect(url)
    }
    return res
  }

  // ✅ Driver routes (if you use this role)
  if (isDriverPath(pathname)) {
    if (role !== 'driver') {
      const url = req.nextUrl.clone()
      url.pathname = isAdmin ? '/dashboard' : '/'
      return NextResponse.redirect(url)
    }
    return res
  }

  return res
}

export const config = {
  matcher: [
    // Admin root routes (A)
    '/login',
    '/dashboard/:path*',
    '/vendors/:path*',
    '/payouts/:path*',
    '/transactions/:path*',
    '/settings/:path*',
    '/orders/:path*',
    '/users/:path*',

    // Vendor + Driver
    '/vendor/:path*',
    '/driver/:path*',
  ],
}