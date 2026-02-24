import { redirect } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase/server'

export async function requireAdmin() {
  const supabase = supabaseServer()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 1) profiles flag
  const { data: profile } = await supabase
    .from('profiles')
    .select('role,is_admin')
    .eq('id', user.id)
    .maybeSingle()

  // 2) admin_users fallback
  const { data: adminRow } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  const isAdmin = profile?.is_admin === true || !!adminRow

  if (!isAdmin) {
    if (profile?.role === 'vendor') redirect('/vendor/dashboard')
    redirect('/')
  }

  return { user, profile }
}