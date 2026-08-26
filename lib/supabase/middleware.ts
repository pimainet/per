import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    return supabaseResponse
  }

  const path = request.nextUrl.pathname

  // Callback tự xử lý session phía client — middleware chỉ refresh cookie nhẹ
  const isCallback = path.startsWith('/auth/callback')
  const isPublic =
    path === '/' ||
    path.startsWith('/login') ||
    path.startsWith('/auth') ||
    path.startsWith('/waitlist')

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        )
      },
    },
  })

  // getUser để refresh session (cần cho cookie)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (isCallback) {
    return supabaseResponse
  }

  const isAuthPage = path.startsWith('/login')
  const isProtected =
    path.startsWith('/onboarding') ||
    path.startsWith('/brand-profile') ||
    path.startsWith('/roadmap') ||
    path.startsWith('/drafts')

  if (isProtected && !user) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('next', path)
    return NextResponse.redirect(redirectUrl)
  }

  // Đã login mà vào /login → về trang chủ (nhẹ), không ép onboarding
  if (isAuthPage && user) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/'
    return NextResponse.redirect(redirectUrl)
  }

  return supabaseResponse
}
