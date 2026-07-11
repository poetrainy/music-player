export interface Song {
  id: string;
  title: string;
  artist: string;
}

export interface User {
  name: string;
  email: string;
  avatarUrl: string;
}

export interface QuotaUsage {
  usedUnits: number;
  totalUnits: number;
  resetAt: string;
}
