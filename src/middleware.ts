import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = [
  '/',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/remind',
  '/service-unavailable',
];

const PUBLIC_PREFIXES = [
  '/_next',
  '/img',
  '/lessons',
  '/favicon',
  '/policy.md',
  '/Invoice.pdf',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  for (const prefix of PUBLIC_PREFIXES) {
    if (pathname.startsWith(prefix)) {
      return NextResponse.next();
    }
  }

  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  if (pathname.endsWith('.webp') || pathname.endsWith('.png') || pathname.endsWith('.jpg') ||
      pathname.endsWith('.svg') || pathname.endsWith('.css') || pathname.endsWith('.js') ||
      pathname.endsWith('.ico') || pathname.endsWith('.md') || pathname.endsWith('.pdf')) {
    return NextResponse.next();
  }

  const deviceToken = request.cookies.get('device_token')?.value;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  let hasAuthToken = false;

  if (supabaseUrl) {
    const projectId = supabaseUrl.match(/https:\/\/([^.]+)\./)?.[1];
    if (projectId) {
      const authCookie = request.cookies.get(`sb-${projectId}-auth-token`)?.value;
      if (authCookie) hasAuthToken = true;
    }
  }

  if (!hasAuthToken) {
    return NextResponse.next();
  }

  if (!deviceToken && pathname !== '/' && !pathname.startsWith('/api/')) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
