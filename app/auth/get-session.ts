'use server'

import { createClient } from '@/lib/supabase/server'
import { ensureUserRecord } from '@/lib/auth/ensure-user'

export async function getUser() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) {
    return null
  }

  // Ensure user record exists (saves/backfills name from metadata).
  await ensureUserRecord(data.user)

  return data.user
}
