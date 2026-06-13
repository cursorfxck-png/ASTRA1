import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // Log the client error server-side for debugging
    // eslint-disable-next-line no-console
    console.error('[client-error]', JSON.stringify(body, null, 2));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[client-error] failed to parse body', err);
  }

  return NextResponse.json({ ok: true });
}
