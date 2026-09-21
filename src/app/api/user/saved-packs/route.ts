import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getDb, saveDb, verifyAuthToken, sanitizeUser } from '@/lib/storage';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('devhub_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'You must be logged in to save stacks.' }, { status: 401 });
    }

    const payload = verifyAuthToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired session.' }, { status: 401 });
    }

    const { name, toolIds } = await request.json();

    if (!name || !Array.isArray(toolIds) || toolIds.length === 0) {
      return NextResponse.json({ error: 'Stack name and at least one tool are required.' }, { status: 400 });
    }

    const db = getDb();
    const user = db.users.find(u => u.id === payload.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    const newPack = {
      id: `pack-${Date.now()}`,
      name: name.trim(),
      toolIds,
      createdAt: new Date().toISOString(),
    };

    user.savedPacks.unshift(newPack);
    saveDb(db);

    return NextResponse.json({ success: true, savedPacks: user.savedPacks, user: sanitizeUser(user) });
  } catch (err: unknown) {
    console.error('Save pack error:', err);
    return NextResponse.json({ error: 'Failed to save stack.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('devhub_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyAuthToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { packId } = await request.json();
    const db = getDb();
    const user = db.users.find(u => u.id === payload.userId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    user.savedPacks = user.savedPacks.filter(p => p.id !== packId);
    saveDb(db);

    return NextResponse.json({ success: true, savedPacks: user.savedPacks });
  } catch (err: unknown) {
    console.error('Delete pack error:', err);
    return NextResponse.json({ error: 'Failed to delete stack' }, { status: 500 });
  }
}
