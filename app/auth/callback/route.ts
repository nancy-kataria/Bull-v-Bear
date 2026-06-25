import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ensureUserRecord } from '@/lib/auth/ensure-user'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  // If 'next' is in params, use it as the final destination (e.g., /dashboard)
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Get the authenticated user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Create/refresh the user record (saves name from the Google profile).
        await ensureUserRecord(user)
      }
      
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // If something goes wrong, redirects to error page
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}