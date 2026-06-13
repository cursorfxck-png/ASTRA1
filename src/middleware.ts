import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  '/',
  '/admin(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  // If a forwarded dev proxy (codespace / GitHub.dev) sends requests where
  // `x-forwarded-host` differs from `origin`, Next's Server Actions validation
  // will reject the request. For POST requests in non-production, rewrite
  // the `origin` header to match `x-forwarded-host` so Server Actions succeed.
  try {
    const xfHost = req.headers.get('x-forwarded-host');
    const proto = req.headers.get('x-forwarded-proto') || req.headers.get('x-forwarded-protocol') || req.headers.get('x-forwarded-scheme');
    const origin = req.headers.get('origin') || req.headers.get('host');
    const isProd = process.env.NODE_ENV === 'production';
    if (!isProd && req.method === 'POST' && xfHost && origin) {
      const originHost = origin.replace(/^https?:\/\//, '').replace(/:\d+$/, '');
      if (xfHost !== origin && xfHost !== originHost) {
        const newOrigin = (proto ? `${proto}://` : '') + xfHost;
        const newHeaders = new Headers(req.headers);
        newHeaders.set('origin', newOrigin);
        return NextResponse.next({ request: { headers: newHeaders } });
      }
    }
  } catch (e) {
    // ignore header rewrite errors in middleware
    // eslint-disable-next-line no-console
    console.warn('middleware header rewrite skipped', e);
  }
  // Handle CORS for API routes
  if (req.nextUrl.pathname.startsWith('/api/')) {
    const response = NextResponse.next();
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }
  }

  if (!isPublicRoute(req)) {
    // In development behind proxies (codespaces / GitHub.dev) the
    // `x-forwarded-host` header may not match the `origin` header which
    // causes Clerk's Server Actions request validation to fail. To avoid
    // blocking local development, only enforce `auth.protect()` when either
    // running in production or when the forwarded host and origin align.
    const xfHost = req.headers.get('x-forwarded-host');
    const origin = req.headers.get('origin') || req.headers.get('host');
    const isProd = process.env.NODE_ENV === 'production';
    if (isProd) {
      await auth.protect();
    } else {
      if (xfHost && origin) {
        const originHost = origin.replace(/^https?:\/\//, '').replace(/:\d+$/, '');
        if (xfHost === originHost || xfHost === origin) {
          await auth.protect();
        } else {
          // Skip protection in dev when headers mismatch to allow local proxies.
          console.warn('Skipping auth.protect() due to x-forwarded-host / origin mismatch in development');
        }
      } else {
        await auth.protect();
      }
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpg|jpeg|png|gif|svg|avif|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)"
  ]
};
