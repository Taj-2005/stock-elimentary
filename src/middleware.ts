import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

async function verify(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (e) {
    console.error('Invalid token:', e);
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const PUBLIC_PATHS = ['/', '/login', '/signup', '/favicon.ico'];

  if (PUBLIC_PATHS.includes(pathname) || pathname.startsWith('/_next')) {
    return NextResponse.next();
  }

  const token = req.cookies.get('token')?.value;
  if (!token) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    return NextResponse.redirect(loginUrl);
  }

  const decoded = await verify(token);
  if (!decoded || !decoded.role) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith('/analyst') && decoded.role !== 'analyst') {
    const url = req.nextUrl.clone();
    url.pathname = `/${decoded.role}`;
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith('/investor') && decoded.role !== 'investor') {
    const url = req.nextUrl.clone();
    url.pathname = `/${decoded.role}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/analyst/:path*', '/investor/:path*'],
};
