import { NextResponse } from 'next/server';
import { getDb, saveDb, createAuthToken, sanitizeUser } from '@/lib/storage';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required.' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long.' }, { status: 400 });
    }

    const db = getDb();
    const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const newUser = {
      id: `user-${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      createdAt: new Date().toISOString(),
      savedPacks: [],
      followedSoftware: ['python', 'ollama', 'vscode'], // Default follows
      downloadHistory: [],
    };

    db.users.push(newUser);
    saveDb(db);

    const token = createAuthToken(newUser);
    const safeUser = sanitizeUser(newUser);

    const response = NextResponse.json({ user: safeUser, token });
    response.cookies.set('devhub_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (err: unknown) {
    console.error('Register error:', err);
    return NextResponse.json({ error: 'Registration failed.' }, { status: 500 });
  }
}
