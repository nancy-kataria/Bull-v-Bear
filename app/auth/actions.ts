'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { ensureUserRecord } from '@/lib/auth/ensure-user'

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

export async function signUpWithEmail(email: string, password: string, name?: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    // Store the name in Supabase auth metadata so it's available on every login.
    options: name?.trim() ? { data: { name: name.trim() } } : undefined,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  // Create the user record (saves the name via ensureUserRecord).
  if (data.user) {
    await ensureUserRecord(data.user)
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

  // Ensure user record exists (backfills name from metadata if present).
  if (data.user) {
    await ensureUserRecord(data.user)
  }

  return { success: true }
}

export async function signOut() {
  const supabase = await createClient()

  await supabase.auth.signOut()

  redirect('/')
}