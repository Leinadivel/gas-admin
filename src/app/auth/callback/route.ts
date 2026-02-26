import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function safeNextPath(nextParam: string | null) {
  // Only allow internal paths like "/driver/invite"
  if (!nextParam) return '/dashboard'
  if (!nextParam.startsWith('/')) return '/dashboard'
  if (nextParam.startsWith('//')) return '/dashboard'
  return nextParam
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const nextRaw = url.searchParams.get('next')
  const next = safeNextPath(nextRaw)

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

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  // If exchange fails, push them to login
  if (error) {
    return NextResponse.redirect(new URL('/login', url.origin))
  }

  return NextResponse.redirect(new URL(next, url.origin))
}