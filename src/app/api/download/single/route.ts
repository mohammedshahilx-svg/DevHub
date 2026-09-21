import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getDb, saveDb, verifyAuthToken } from '@/lib/storage';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Software ID is required.' }, { status: 400 });
    }

    const db = getDb();
    const tool = db.software.find(s => s.id === id);

    if (!tool) {
      return NextResponse.json({ error: 'Software not found.' }, { status: 404 });
    }

    // Record in user history if authenticated
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get('devhub_token')?.value;
      if (token) {
        const payload = verifyAuthToken(token);
        if (payload) {
          const user = db.users.find(u => u.id === payload.userId);
          if (user) {
            user.downloadHistory.unshift({
              id: `dl-${Date.now()}`,
              softwareNames: [tool.name],
              toolIds: [tool.id],
              date: new Date().toISOString(),
              format: 'single',
            });
            user.downloadHistory = user.downloadHistory.slice(0, 20);
            saveDb(db);
          }
        }
      }
    } catch (authErr) {
      console.warn('Could not record user download history:', authErr);
    }

    // Redirect to direct installer download URL
    return NextResponse.redirect(tool.downloadUrl);
  } catch (err: unknown) {
    console.error('Single download error:', err);
    return NextResponse.json({ error: 'Download failed.' }, { status: 500 });
  }
}
