import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getDb, verifyAuthToken, sanitizeUser } from '@/lib/storage';

export async function GET(request: Request) {
  try {
    let token: string | undefined;

    // Check cookie
    const cookieStore = await cookies();
    token = cookieStore.get('devhub_token')?.value;

    // Check Authorization header fallback
    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.slice(7);
      }
    }

    if (!token) {
      return NextResponse.json({ user: null });
    }

    const payload = verifyAuthToken(token);
    if (!payload) {
      return NextResponse.json({ user: null });
    }

    const db = getDb();
    const user = db.users.find(u => u.id === payload.userId);
    if (!user) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({ user: sanitizeUser(user) });
  } catch (err: unknown) {
    console.error('Auth me error:', err);
    return NextResponse.json({ user: null });
  }
}
