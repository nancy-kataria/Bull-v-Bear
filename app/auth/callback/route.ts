import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/prisma/prisma'

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
        // Check if user already exists in database
        const existingUser = await prisma.user.findUnique({
          where: { id: user.id }
        })
        
        // Create user record if it doesn't exist
        if (!existingUser) {
          await prisma.user.create({
            data: {
              id: user.id,
              email: user.email || '',
            }
          })
        }
      }
      
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // If something goes wrong, redirects to error page
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}