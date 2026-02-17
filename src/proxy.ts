import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(req: NextRequest) {
  return NextResponse.next()
}


export const config = {
  matcher: ['/((?!_next|favicon.ico).*)'],
}
