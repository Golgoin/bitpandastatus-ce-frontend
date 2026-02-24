import { NextRequest, NextResponse } from 'next/server';

const FLASH_COOKIE_NAME = 'bp_asset_not_found';
const FLASH_COOKIE_MAX_AGE_SECONDS = 20;

const normalizeSymbol = (rawSymbol: string) => (
  rawSymbol
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '')
    .slice(0, 24)
);

const normalizeReturnTo = (rawReturnTo: string | null) => {
  if (!rawReturnTo) return '/';
  if (!rawReturnTo.startsWith('/')) return '/';
  if (rawReturnTo.startsWith('//')) return '/';
  return rawReturnTo;
};

export async function GET(request: NextRequest) {
  const symbolParam = request.nextUrl.searchParams.get('symbol') ?? '';
  const normalizedSymbol = normalizeSymbol(symbolParam) || 'unknown';

  const rawReturnTo = request.nextUrl.searchParams.get('returnTo');
  const returnTo = normalizeReturnTo(rawReturnTo);

  // Use a relative Location header so the browser keeps the public host.
  const response = new NextResponse(null, {
    status: 302,
    headers: {
      Location: returnTo,
    },
  });

  response.cookies.set({
    name: FLASH_COOKIE_NAME,
    value: normalizedSymbol,
    maxAge: FLASH_COOKIE_MAX_AGE_SECONDS,
    path: '/',
    sameSite: 'lax',
  });

  return response;
}
