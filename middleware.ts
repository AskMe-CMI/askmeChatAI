import { NextResponse, type NextRequest } from 'next/server';
import { getSessionFromAPI } from './lib/auth/local-auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // console.log('🔍 Middleware called for:', pathname);

  // ตรวจจับ POST requests เพื่อ debug
  if (request.method === 'POST') {
    // console.log(`📮 POST request detected:`, {
    //   url: pathname,
    //   contentType: request.headers.get('content-type'),
    //   hasBody: request.body !== null,
    //   userAgent: request.headers.get('user-agent')?.slice(0, 50),
    // });

    // พยายามอ่าน request body เพื่อ debug
    try {
      const clonedRequest = request.clone();
      const contentType = request.headers.get('content-type') || '';

      if (contentType.includes('application/x-www-form-urlencoded')) {
        const formData = await clonedRequest.formData();
        // console.log('📝 Form data:', Object.fromEntries(formData.entries()));
      } else if (contentType.includes('application/json')) {
        const jsonBody = await clonedRequest.json();
        // console.log('📝 JSON body:', jsonBody);
      } else {
        const textBody = await clonedRequest.text();
        // console.log('📝 Text body (first 200 chars):', textBody.slice(0, 200));
      }
    } catch (e) {
      // console.log(
      //   '❌ Failed to read request body:',
      //   e instanceof Error ? e.message : String(e),
      // );
    }

    // อ่าน body สำหรับ debug (ถ้าเป็น form data)
    if (
      request.headers
        .get('content-type')
        ?.includes('application/x-www-form-urlencoded')
    ) {
      try {
        const clonedRequest = request.clone();
        const body = await clonedRequest.text();
        // console.log(`📄 Form data body:`, body);
      } catch (error) {
        // console.log(`❌ Could not read body:`, error);
      }
    }
  }

  // Allow ping requests for testing purposes
  if (pathname.startsWith('/ping')) {
    return new Response('pong', { status: 200 });
  }

  // Allow requests to auth pages to proceed
  if (pathname === '/login' || pathname === '/login-backup' || pathname === '/oidc/callback' || pathname === '/logint') {
    console.log('🔓 Allowing auth page access:', pathname);
    return NextResponse.next();
  }

  // Get the session from our API-based authentication
  // console.log('🔐 Getting session from API...');
  const session = await getSessionFromAPI();
  // console.log('🔐 Session result:', session ? 'Found' : 'Not found');

  // If there is no session, redirect to the login page
  if (!session) {
    // But don't redirect for API routes, let them handle auth themselves if needed
    if (pathname.startsWith('/api/')) {
      // console.log('🔓 Allowing API route without session:', pathname);
      return NextResponse.next();
    }
    // console.log('❌ No session, redirecting to login from:', pathname);
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // console.log('✅ Session found, allowing access to:', pathname);

  // If the user is logged in and tries to access login pages, redirect to home
  if (session && (pathname === '/login' || pathname === '/login-backup' || pathname === '/oidc/callback' || pathname === '/logint')) {
    // console.log('🏠 Redirecting logged-in user from login to home');
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - login pages
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|login).*)',
  ],
};
