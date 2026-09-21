import fs from 'fs';
import path from 'path';
import { User, NotificationItem, SoftwareItem } from './types';
import { INITIAL_CATALOG } from './catalogData';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Dedicated user data directory
export const USER_DATA_DIR = path.join(process.cwd(), 'user_data');
export const USERS_DIR = path.join(USER_DATA_DIR, 'users');
export const STACKS_DIR = path.join(USER_DATA_DIR, 'saved_stacks');
export const DOWNLOADS_DIR = path.join(USER_DATA_DIR, 'downloads');
export const DB_FILE = path.join(USER_DATA_DIR, 'database.json');

const JWT_SECRET = process.env.JWT_SECRET || 'devhub-super-secret-key-2026';

export interface DatabaseSchema {
  users: User[];
  software: SoftwareItem[];
  notifications: NotificationItem[];
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    softwareId: 'python',
    softwareName: 'Python 3',
    version: '3.13.1',
    title: 'Python 3.13.1 Released',
    message: 'Official release with experimental free-threading mode and enhanced REPL.',
    date: '2026-09-19T10:00:00Z',
    read: false,
    type: 'update',
  },
  {
    id: 'notif-2',
    softwareId: 'ollama',
    softwareName: 'Ollama',
    version: '0.5.8',
    title: 'Ollama v0.5.8 Update',
    message: 'Added support for DeepSeek-R1 70B quantized models and GPU optimizations.',
    date: '2026-09-18T14:30:00Z',
    read: false,
    type: 'feature',
  },
  {
    id: 'notif-3',
    softwareId: 'cursor',
    softwareName: 'Cursor',
    version: '0.45.6',
    title: 'Cursor Agent Mode Released',
    message: 'Agent mode now autonomously plans and executes multi-file code refactors.',
    date: '2026-09-20T08:15:00Z',
    read: false,
    type: 'feature',
  },
];

export function ensureUserDataDirs(): void {
  const dirs = [USER_DATA_DIR, USERS_DIR, STACKS_DIR, DOWNLOADS_DIR];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

// Sync individual files in user_data folder
function syncDedicatedFiles(db: DatabaseSchema): void {
  try {
    ensureUserDataDirs();
    // 1. Write individual user JSON files
    db.users.forEach(u => {
      const userFilePath = path.join(USERS_DIR, `${u.id}.json`);
      fs.writeFileSync(userFilePath, JSON.stringify(sanitizeUser(u), null, 2), 'utf-8');

      // 2. Write individual saved stacks
      u.savedPacks.forEach(pack => {
        const stackFilePath = path.join(STACKS_DIR, `${pack.id}.json`);
        fs.writeFileSync(stackFilePath, JSON.stringify({ userId: u.id, userName: u.name, ...pack }, null, 2), 'utf-8');
      });

      // 3. Write individual download records
      u.downloadHistory.forEach(dl => {
        const dlFilePath = path.join(DOWNLOADS_DIR, `${dl.id}.json`);
        fs.writeFileSync(dlFilePath, JSON.stringify({ userId: u.id, userName: u.name, ...dl }, null, 2), 'utf-8');
      });
    });
  } catch (err) {
    console.error('Error syncing dedicated user data files:', err);
  }
}

export function getDb(): DatabaseSchema {
  ensureUserDataDirs();

  // If old database in data/ exists, migrate it to user_data
  const oldDbFile = path.join(process.cwd(), 'data', 'devhub-store.json');
  if (!fs.existsSync(DB_FILE) && fs.existsSync(oldDbFile)) {
    try {
      const oldData = fs.readFileSync(oldDbFile, 'utf-8');
      fs.writeFileSync(DB_FILE, oldData, 'utf-8');
    } catch {
      // ignore
    }
  }

  if (!fs.existsSync(DB_FILE)) {
    const demoPasswordHash = bcrypt.hashSync('demo1234', 10);
    const initialDb: DatabaseSchema = {
      users: [
        {
          id: 'user-demo-1',
          name: 'Alex Developer',
          email: 'alex@devhub.local',
          passwordHash: demoPasswordHash,
          createdAt: new Date().toISOString(),
          savedPacks: [
            {
              id: 'pack-1',
              name: 'Local AI Research Stack',
              toolIds: ['ollama', 'python', 'cursor', 'git'],
              createdAt: new Date().toISOString(),
            },
            {
              id: 'pack-2',
              name: 'C/C++ High Performance',
              toolIds: ['gcc-mingw', 'llvm-clang', 'vscode', 'git'],
              createdAt: new Date().toISOString(),
            },
          ],
          followedSoftware: ['python', 'ollama', 'cursor', 'rust', 'gcc-mingw'],
          downloadHistory: [
            {
              id: 'dl-1',
              softwareNames: ['Ollama', 'Python 3', 'Cursor'],
              toolIds: ['ollama', 'python', 'cursor'],
              date: new Date(Date.now() - 86400000).toISOString(),
              format: 'zip',
            },
          ],
        },
      ],
      software: INITIAL_CATALOG,
      notifications: INITIAL_NOTIFICATIONS,
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), 'utf-8');
    syncDedicatedFiles(initialDb);
    return initialDb;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as DatabaseSchema;
    // Always ensure latest catalog data URLs are refreshed
    parsed.software = INITIAL_CATALOG;
    return parsed;
  } catch (err) {
    console.error('Error reading db:', err);
    return { users: [], software: INITIAL_CATALOG, notifications: INITIAL_NOTIFICATIONS };
  }
}

export function saveDb(data: DatabaseSchema): void {
  ensureUserDataDirs();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  syncDedicatedFiles(data);
}

// Authentication Helpers
export function createAuthToken(user: User): string {
  return jwt.sign(
    { userId: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyAuthToken(token: string): { userId: string; email: string; name: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string; name: string };
  } catch {
    return null;
  }
}

export function sanitizeUser(user: User): Omit<User, 'passwordHash'> {
  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
}
