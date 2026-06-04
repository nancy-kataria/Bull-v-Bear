'use server'

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/prisma/prisma'

export async function getSession() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getSession()
  
  if (error || !data.session) {
    return null
  }
  
  return data.session
}

export async function getUser() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  
  if (error || !data.user) {
    return null
  }
  
  // Ensure user record exists in database
  const user = data.user
  const existingUser = await prisma.user.findUnique({
    where: { id: user.id }
  })
  
  if (!existingUser) {
    await prisma.user.create({
      data: {
        id: user.id,
        email: user.email || '',
      }
    })
  }
  
  return user
}
