import { redirect } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase/server'

export async function requireAdmin() {
  const supabase = supabaseServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role,is_admin')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.is_admin !== true) {
    if (profile?.role === 'vendor') redirect('/vendor/dashboard')
    redirect('/')
  }

  return { user, profile }
}