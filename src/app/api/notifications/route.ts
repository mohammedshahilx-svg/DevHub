import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getDb, saveDb, verifyAuthToken } from '@/lib/storage';
import { NotificationItem } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filterFollowed = searchParams.get('followed') === 'true';

    const db = getDb();
    let notifications = [...db.notifications];

    if (filterFollowed) {
      const cookieStore = await cookies();
      const token = cookieStore.get('devhub_token')?.value;
      if (token) {
        const payload = verifyAuthToken(token);
        if (payload) {
          const user = db.users.find(u => u.id === payload.userId);
          if (user) {
            notifications = notifications.filter(n => user.followedSoftware.includes(n.softwareId));
          }
        }
      }
    }

    // Sort newest first
    notifications.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const unreadCount = notifications.filter(n => !n.read).length;

    return NextResponse.json({ notifications, unreadCount });
  } catch (err: unknown) {
    console.error('Notifications fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { notificationId, markAllRead } = await request.json();
    const db = getDb();

    if (markAllRead) {
      db.notifications.forEach(n => { n.read = true; });
    } else if (notificationId) {
      const target = db.notifications.find(n => n.id === notificationId);
      if (target) {
        target.read = true;
      }
    }

    saveDb(db);
    return NextResponse.json({ success: true, notifications: db.notifications });
  } catch (err: unknown) {
    console.error('Mark read error:', err);
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}

// POST: Simulate or post a new release notification
export async function POST(request: Request) {
  try {
    const { softwareId, newVersion, changeSummary } = await request.json();

    const db = getDb();
    const software = db.software.find(s => s.id === softwareId);

    if (!software) {
      return NextResponse.json({ error: 'Software not found' }, { status: 404 });
    }

    const version = newVersion || `${software.version}.1`;
    software.version = version;
    software.lastUpdated = 'Just now';

    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      softwareId: software.id,
      softwareName: software.name,
      version: version,
      title: `${software.name} updated to v${version}`,
      message: changeSummary || `Official release v${version} is now available for download.`,
      date: new Date().toISOString(),
      read: false,
      type: 'update',
    };

    db.notifications.unshift(newNotif);
    saveDb(db);

    return NextResponse.json({ success: true, notification: newNotif, software });
  } catch (err: unknown) {
    console.error('Post notification error:', err);
    return NextResponse.json({ error: 'Failed to dispatch notification' }, { status: 500 });
  }
}
