export type SoftwareCategory = 'ai' | 'compiler' | 'runtime' | 'ide' | 'tool';

export interface SoftwareItem {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: SoftwareCategory;
  platforms: ('windows' | 'mac' | 'linux')[];
  iconType: string;
  version: string;
  lastUpdated: string;
  license: string;
  website: string;
  downloadUrl: string;
  wingetId?: string;
  sizeEstimate: string;
  featured?: boolean;
  tags: string[];
  releaseNotes: string;
  verified: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  savedPacks: SavedPack[];
  followedSoftware: string[];
  downloadHistory: DownloadRecord[];
}

export interface SavedPack {
  id: string;
  name: string;
  toolIds: string[];
  createdAt: string;
}

export interface DownloadRecord {
  id: string;
  softwareNames: string[];
  toolIds: string[];
  date: string;
  format: 'zip' | 'single';
}

export interface NotificationItem {
  id: string;
  softwareId: string;
  softwareName: string;
  version: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'update' | 'security' | 'feature';
}
