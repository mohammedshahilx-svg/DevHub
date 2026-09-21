import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getDb, saveDb, verifyAuthToken, sanitizeUser } from '@/lib/storage';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('devhub_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Please log in to track updates for this software.' }, { status: 401 });
    }

    const payload = verifyAuthToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { softwareId } = await request.json();
    if (!softwareId) {
      return NextResponse.json({ error: 'Software ID required' }, { status: 400 });
    }

    const db = getDb();
    const user = db.users.find(u => u.id === payload.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const index = user.followedSoftware.indexOf(softwareId);
    let following: boolean;
    if (index > -1) {
      user.followedSoftware.splice(index, 1);
      following = false;
    } else {
      user.followedSoftware.push(softwareId);
      following = true;
    }

    saveDb(db);

    return NextResponse.json({
      success: true,
      following,
      followedSoftware: user.followedSoftware,
      user: sanitizeUser(user),
    });
  } catch (err: unknown) {
    console.error('Follow error:', err);
    return NextResponse.json({ error: 'Failed to update follow status' }, { status: 500 });
  }
}
