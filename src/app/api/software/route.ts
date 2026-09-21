import { NextResponse } from 'next/server';
import { getDb } from '@/lib/storage';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const query = searchParams.get('q')?.toLowerCase();
    const platform = searchParams.get('platform');

    const db = getDb();
    let items = db.software;

    if (category && category !== 'all') {
      items = items.filter(item => item.category === category);
    }

    if (platform && platform !== 'all') {
      items = items.filter(item => item.platforms.includes(platform as 'windows' | 'mac' | 'linux'));
    }

    if (query) {
      items = items.filter(item => 
        item.name.toLowerCase().includes(query) ||
        item.tagline.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.tags.some(t => t.toLowerCase().includes(query))
      );
    }

    return NextResponse.json({ items, total: items.length });
  } catch (err: unknown) {
    console.error('Software list error:', err);
    return NextResponse.json({ error: 'Failed to fetch software' }, { status: 500 });
  }
}
