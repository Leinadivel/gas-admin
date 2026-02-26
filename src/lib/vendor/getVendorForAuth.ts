import { supabase } from '@/lib/supabase/client'

export type VendorRow = {
  id: string
  business_name: string | null
  profile_id: string | null
  user_id: string | null
  created_at: string | null
}

export async function getVendorForAuth() {
  const { data: userData, error: userErr } = await supabase.auth.getUser()
  if (userErr) throw new Error(userErr.message)

  const authId = userData.user?.id
  if (!authId) throw new Error('Not logged in')

  const { data: rows, error } = await supabase
    .from('vendors')
    .select('id,business_name,profile_id,user_id,created_at')
    .or(`profile_id.eq.${authId},user_id.eq.${authId},id.eq.${authId}`)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  const list = (rows ?? []) as VendorRow[]

  // Prefer exact profile_id match, then user_id, then any latest row.
  const vendor =
    list.find((r) => r.profile_id === authId) ??
    list.find((r) => r.user_id === authId) ??
    list[0] ??
    null

  if (!vendor) throw new Error('Vendor profile not found for this account.')

  return { vendor, authId }
}