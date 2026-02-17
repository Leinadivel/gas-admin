import { createBrowserClient } from '@supabase/ssr'

// Client-side Supabase instance (for browser / client components)
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)