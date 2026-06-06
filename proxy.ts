import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  // creating an initial response
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Initializing the non-deprecated client
  // The create client util cannot be used here because Middleware runs before the request reaches your app. 
  // It has access to the NextRequest and NextResponse objects directly. The createClient utility uses 
  // next/headers, which doesn't allow you to "write back" session refreshes to the NextResponse effectively 
  // inside the middleware loop.
  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Syncing cookies to the request so the rest of the app sees them
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          
          // Create a new response to carry the new headers
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          
          // Syncing cookies to the outgoing response for the browser
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getUser() automatically triggers setAll() if the session is refreshed
  const { data: { user } } = await supabase.auth.getUser()

  // Protection Logic
  const isProtectedPath = 
    request.nextUrl.pathname.startsWith('/analysis-room') || 
    request.nextUrl.pathname.startsWith('/trading-assistant') ||
    request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/ingest');

  if (!user && isProtectedPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}