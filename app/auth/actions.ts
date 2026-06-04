'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { prisma } from '@/prisma/prisma'

export async function signInWithGoogle() {
  const supabase = await createClient()
  const origin = (await headers()).get('origin')

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback?next=/dashboard`,
    },
  })

  if (error) {
    console.error('Login Error:', error)
    return redirect('/login?error=Could not authenticate with Google')
  }

  // Redirect the user to Google's login page
  return redirect(data.url)
}

export async function signUpWithEmail(email: string, password: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  // Create user record in database if sign up was successful
  if (data.user) {
    const existingUser = await prisma.user.findUnique({
      where: { id: data.user.id }
    })
    
    if (!existingUser) {
      await prisma.user.create({
        data: {
          id: data.user.id,
          email: data.user.email || '',
        }
      })
    }
  }

  return { success: true, message: 'Check your email to verify your account' }
}

export async function signInWithEmail(email: string, password: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  // Ensure user record exists in database
  if (data.user) {
    const existingUser = await prisma.user.findUnique({
      where: { id: data.user.id }
    })
    
    if (!existingUser) {
      await prisma.user.create({
        data: {
          id: data.user.id,
          email: data.user.email || '',
        }
      })
    }
  }

  return { success: true }
}

export async function signOut() {
  const supabase = await createClient()

  await supabase.auth.signOut()

  redirect('/')
}