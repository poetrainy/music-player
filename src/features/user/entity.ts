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
